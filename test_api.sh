#!/bin/bash

# Atlas API 自动化测试脚本
# 用法: ./test_api.sh

set -e

BASE_URL="https://atlas.matrix-net.tech/atlas/api"
USERNAME="admin"
PASSWORD="admin123"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 日志函数
log_test() {
    echo -e "\n${YELLOW}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

log_info() {
    echo -e "[INFO] $1"
}

# 测试结果摘要
print_summary() {
    echo -e "\n=========================================="
    echo -e "测试摘要"
    echo -e "=========================================="
    echo -e "总测试数: $TOTAL_TESTS"
    echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
    echo -e "${RED}失败: $FAILED_TESTS${NC}"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}✅ 所有测试通过!${NC}"
    else
        echo -e "\n${RED}❌ 有 $FAILED_TESTS 个测试失败${NC}"
    fi
}

# ==================== 1. 认证接口测试 ====================

echo -e "\n=========================================="
echo -e "1. 认证接口测试"
echo -e "=========================================="

# 1.1 用户登录
log_test "用户登录 POST /auth/login"
LOGIN_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.access_token')
    if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
        log_pass "登录成功,获取到 token: ${TOKEN:0:30}..."
        log_info "Token type: $(echo "$RESPONSE_BODY" | jq -r '.token_type')"
        log_info "Expires in: $(echo "$RESPONSE_BODY" | jq -r '.expires_in') 秒"
    else
        log_fail "登录成功但未获取到 token"
        TOKEN=""
    fi
else
    log_fail "登录失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
    TOKEN=""
fi

# 如果登录失败,退出测试
if [ -z "$TOKEN" ]; then
    echo -e "\n${RED}❌ 登录失败,无法继续测试${NC}"
    print_summary
    exit 1
fi

# 1.2 获取当前用户信息
log_test "获取当前用户 GET /auth/me"
ME_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$ME_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$ME_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    log_pass "获取用户信息成功"
    log_info "Username: $(echo "$RESPONSE_BODY" | jq -r '.username')"
    log_info "Email: $(echo "$RESPONSE_BODY" | jq -r '.email')"
else
    log_fail "获取用户信息失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
fi

# ==================== 2. 智能体管理测试 ====================

echo -e "\n=========================================="
echo -e "2. 智能体管理测试"
echo -e "=========================================="

# 2.1 获取智能体列表
log_test "获取智能体列表 GET /agents"
AGENTS_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X GET "$BASE_URL/agents" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$AGENTS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$AGENTS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    AGENT_COUNT=$(echo "$RESPONSE_BODY" | jq 'length')
    log_pass "获取智能体列表成功,共 $AGENT_COUNT 个智能体"
    if [ "$AGENT_COUNT" -gt 0 ]; then
        log_info "第一个智能体: $(echo "$RESPONSE_BODY" | jq -r '.[0].name')"
    fi
else
    log_fail "获取智能体列表失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
fi

# 2.2 创建智能体
TEST_AGENT_NAME="test-agent-$(date +%s)"
log_test "创建智能体 POST /agents"
CREATE_AGENT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X POST "$BASE_URL/agents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_AGENT_NAME\",
    \"display_name\": \"测试智能体\",
    \"agent_type\": \"general\",
    \"description\": \"自动化测试创建的智能体\"
  }")

HTTP_CODE=$(echo "$CREATE_AGENT_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CREATE_AGENT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    log_pass "创建智能体成功: $TEST_AGENT_NAME"
    CREATED_AGENT_ID=$(echo "$RESPONSE_BODY" | jq -r '.id')
    log_info "Agent ID: $CREATED_AGENT_ID"
else
    log_fail "创建智能体失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
    TEST_AGENT_NAME=""
fi

# 2.3 获取智能体详情
if [ -n "$TEST_AGENT_NAME" ]; then
    log_test "获取智能体详情 GET /agents/{agent_name}"
    GET_AGENT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X GET "$BASE_URL/agents/$TEST_AGENT_NAME" \
      -H "Authorization: Bearer $TOKEN")
    
    HTTP_CODE=$(echo "$GET_AGENT_RESPONSE" | tail -n 1)
    RESPONSE_BODY=$(echo "$GET_AGENT_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_pass "获取智能体详情成功"
        log_info "Display name: $(echo "$RESPONSE_BODY" | jq -r '.display_name')"
        log_info "Status: $(echo "$RESPONSE_BODY" | jq -r '.status')"
    else
        log_fail "获取智能体详情失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
fi

# 2.4 更新智能体
if [ -n "$TEST_AGENT_NAME" ]; then
    log_test "更新智能体 PUT /agents/{agent_name}"
    UPDATE_AGENT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X PUT "$BASE_URL/agents/$TEST_AGENT_NAME" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"display_name\": \"测试智能体(已更新)\",
        \"description\": \"测试更新功能\"
      }")
    
    HTTP_CODE=$(echo "$UPDATE_AGENT_RESPONSE" | tail -n 1)
    RESPONSE_BODY=$(echo "$UPDATE_AGENT_RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ]; then
        log_pass "更新智能体成功"
        log_info "New display name: $(echo "$RESPONSE_BODY" | jq -r '.display_name')"
    else
        log_fail "更新智能体失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
fi

# 2.5 删除智能体
if [ -n "$TEST_AGENT_NAME" ]; then
    log_test "删除智能体 DELETE /agents/{agent_name}"
    DELETE_AGENT_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X DELETE "$BASE_URL/agents/$TEST_AGENT_NAME" \
      -H "Authorization: Bearer $TOKEN")
    
    HTTP_CODE=$(echo "$DELETE_AGENT_RESPONSE" | tail -n 1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        log_pass "删除智能体成功"
    else
        RESPONSE_BODY=$(echo "$DELETE_AGENT_RESPONSE" | sed '$d')
        log_fail "删除智能体失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
    fi
fi

# ==================== 3. 客服管理测试 ====================

echo -e "\n=========================================="
echo -e "3. 客服管理测试"
echo -e "=========================================="

# 3.1 获取客服列表
log_test "获取客服列表 GET /conversations"
CONVERSATIONS_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X GET "$BASE_URL/conversations" \
  -H "Authorization: Bearer $TOKEN")

HTTP_CODE=$(echo "$CONVERSATIONS_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$CONVERSATIONS_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    CONV_COUNT=$(echo "$RESPONSE_BODY" | jq 'length')
    log_pass "获取客服列表成功,共 $CONV_COUNT 个客服"
else
    log_fail "获取客服列表失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
fi

# ==================== 4. 健康检查 ====================

echo -e "\n=========================================="
echo -e "4. 系统健康检查"
echo -e "=========================================="

log_test "健康检查 GET /health"
HEALTH_RESPONSE=$(curl -k -s -w "\n%{http_code}" -X GET "https://atlas.matrix-net.tech/atlas/health")

HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n 1)
RESPONSE_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    log_pass "系统健康检查通过"
    log_info "Response: $RESPONSE_BODY"
else
    log_fail "系统健康检查失败 (HTTP $HTTP_CODE): $RESPONSE_BODY"
fi

# ==================== 打印测试摘要 ====================

print_summary

# 退出码
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
else
    exit 1
fi
