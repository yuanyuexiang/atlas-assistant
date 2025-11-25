# 删除客服 500 错误报告

## 错误描述

删除客服时返回 500 Internal Server Error

## 错误信息

```
DELETE https://atlas.matrix-net.tech/atlas/api/conversations/ec748184-fa99-455e-ad45-13f924df7298
Status: 500 Internal Server Error
```

## 受影响的客服

- ID: `ec748184-fa99-455e-ad45-13f924df7298`
- Name: `test_conv_1763997056485`
- Display Name: `更新后的客服名称`
- Message Count: 6 条消息

## 可能的原因

### 1. 外键约束问题（最可能）

删除客服时，关联的数据没有正确处理：

**可能的关联数据：**
- `messages` 表 - 6 条消息记录
- `conversation_sessions` 表 - 对话会话
- `conversation_participants` 表 - 参与者
- 其他关联表

**错误场景：**
```python
# 错误的实现
def delete_conversation(conversation_id):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    db.delete(conversation)  # ❌ 如果有外键约束，会报错
    db.commit()
```

**正确的实现：**
```python
# 方案 A: 级联删除
class Conversation(Base):
    messages = relationship("Message", 
                          cascade="all, delete-orphan",  # ✅ 自动删除关联消息
                          back_populates="conversation")

# 方案 B: 手动删除
def delete_conversation(conversation_id):
    conversation = db.query(Conversation).filter_by(id=conversation_id).first()
    
    # 先删除关联数据
    db.query(Message).filter_by(conversation_id=conversation_id).delete()
    db.query(Session).filter_by(conversation_id=conversation_id).delete()
    
    # 再删除客服
    db.delete(conversation)
    db.commit()
```

### 2. 事务回滚问题

删除操作中途失败，但没有正确回滚：

```python
try:
    # 删除客服
    db.delete(conversation)
    db.commit()
except Exception as e:
    db.rollback()  # ✅ 需要回滚
    raise
```

### 3. 数据库锁问题

客服正在被其他事务使用，导致删除失败。

### 4. 权限问题

数据库用户没有删除关联表记录的权限。

## 需要的后端日志

请提供完整的后端错误堆栈：

```bash
# 查看 Docker 日志
docker-compose logs atlas --tail=100

# 或查看应用日志
tail -f /var/log/atlas/error.log
```

**需要的信息：**
- 完整的错误堆栈
- 数据库错误信息
- 是否有 SQL 错误
- 事务状态

## 临时解决方案（前端）

在等待后端修复期间，前端可以添加更友好的错误提示：

```typescript
catch (error: any) {
  if (error.response?.status === 500) {
    message.error('删除失败：服务器内部错误，请联系管理员或稍后重试');
    console.error('删除失败详情:', {
      conversationId: conversation.id,
      conversationName: conversation.name,
      messageCount: conversation.message_count,
      error: error.response?.data
    });
  } else if (error.response?.status === 404) {
    message.warning('该客服已不存在');
    listRefetchRef.current?.();
  } else {
    const errorMsg = error.response?.data?.detail || error.message || '删除失败';
    message.error(errorMsg);
  }
}
```

## 建议的后端修复步骤

### 1. 检查数据库模型定义

确认 `Conversation` 模型的关联关系：

```python
class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True)
    
    # ✅ 确保配置了级联删除
    messages = relationship(
        "Message",
        cascade="all, delete-orphan",
        back_populates="conversation"
    )
    
    sessions = relationship(
        "Session",
        cascade="all, delete-orphan",
        back_populates="conversation"
    )
```

### 2. 修改删除方法

```python
def delete_conversation(self, db: Session, conversation_name: str) -> bool:
    """删除客服及其所有关联数据"""
    try:
        # 查找客服（支持 ID 或 Name）
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_name
        ).first()
        
        if not conversation:
            conversation = db.query(Conversation).filter(
                Conversation.name == conversation_name
            ).first()
        
        if not conversation:
            raise ValueError(f"客服不存在: {conversation_name}")
        
        # 如果模型配置了 cascade，直接删除即可
        db.delete(conversation)
        db.commit()
        
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"删除客服失败: {str(e)}", exc_info=True)
        raise
```

### 3. 添加事务日志

```python
import logging

logger = logging.getLogger(__name__)

def delete_conversation(self, db: Session, conversation_name: str) -> bool:
    logger.info(f"开始删除客服: {conversation_name}")
    
    try:
        conversation = self._get_conversation(db, conversation_name)
        
        # 记录关联数据数量
        message_count = db.query(Message).filter_by(
            conversation_id=conversation.id
        ).count()
        
        logger.info(f"客服 {conversation.name} 有 {message_count} 条消息")
        
        db.delete(conversation)
        db.commit()
        
        logger.info(f"成功删除客服: {conversation.name}")
        return True
        
    except Exception as e:
        logger.error(f"删除失败: {str(e)}", exc_info=True)
        db.rollback()
        raise
```

## 测试验证

修复后请测试：

1. **删除没有消息的客服** - 应该成功
2. **删除有消息的客服** - 应该成功，消息也被删除
3. **删除不存在的客服** - 应该返回 404
4. **删除正在使用的客服** - 应该有友好的错误提示

## 优先级

**高** - 影响核心 CRUD 功能，用户无法删除客服

---

**报告时间**: 2025-11-26  
**错误状态**: ❌ 待修复  
**影响范围**: 所有有消息记录的客服删除操作
