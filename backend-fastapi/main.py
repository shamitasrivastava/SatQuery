from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import VqaRequest, VqaResponse, ChangeDetectionRequest, ChangeDetectionResponse, AgenticTraceResponse
from vqa_service import vqa_engine
from change_service import change_engine
from router import task_router

app = FastAPI(title="SatQuery API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def health():
    return {"status": "ONLINE", "models": ["Falcon-0.7B-RS-LoRA", "SAM-HQ", "Open-CD (LEVIR-CD)"]}

@app.post("/api/vqa", response_model=VqaResponse)
async def run_vqa(request: VqaRequest):
    return await vqa_engine.predict_vqa_and_grounding(request)

@app.post("/api/change-detection", response_model=ChangeDetectionResponse)
async def run_change_detection(request: ChangeDetectionRequest):
    return await change_engine.compute_change_mask_and_summary(request)

@app.post("/api/audit-trace", response_model=AgenticTraceResponse)
def get_audit_trace(query: str):
    return task_router.route_query(query)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)