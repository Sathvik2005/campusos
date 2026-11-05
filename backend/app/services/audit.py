import uuid

from sqlalchemy.orm import Session

from app.models import AuditEvent


def record_audit(db: Session, *, actor_id: uuid.UUID | None, action: str, entity_type: str,
                 entity_id: uuid.UUID | None = None, old: dict | None = None, new: dict | None = None,
                 reason: str | None = None) -> AuditEvent:
    """Adds an audit row to the caller's transaction (so it commits or rolls back with the change)."""
    ev = AuditEvent(actor_id=actor_id, action=action, entity_type=entity_type, entity_id=entity_id,
                    old_value=old, new_value=new, reason=reason)
    db.add(ev)
    return ev
