from fastapi import APIRouter, Depends

from app.core.security import CurrentUser, get_current_user
from app.schemas.api import MeOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=MeOut)
def me(user: CurrentUser = Depends(get_current_user)):
    return MeOut(id=user.id, role=user.role, display_name=user.display_name, faculty_id=user.faculty_id)
