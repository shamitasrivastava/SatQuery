from ninja import NinjaAPI
from apps.router.api import router as task_router

api = NinjaAPI(
    title="SatQuery AI Backend",
    version="1.0.0",
    description="Agentic Remote Sensing Vision-Language Assistant & Task Router — ISRO/SAC SIH 2026",
    docs_url="/docs"
)

# Register task router
api.add_router("/", task_router)
