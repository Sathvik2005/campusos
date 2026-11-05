from fastapi import APIRouter

from app.api.v1.endpoints import academic, attendance, audit_overview, auth, fees, insights, marks, students

api_router = APIRouter()
for module in (auth, academic, students, attendance, marks, fees, insights, audit_overview):
    api_router.include_router(module.router)
