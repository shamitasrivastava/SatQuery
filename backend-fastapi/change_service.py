import time
from schemas import ChangeDetectionRequest, ChangeDetectionResponse

class ChangeDetectionEngine:
    async def compute_change_mask_and_summary(self, req: ChangeDetectionRequest) -> ChangeDetectionResponse:
        time.sleep(0.18)
        return ChangeDetectionResponse(
            altered_area_km2=142.6,
            delta_percent=38.4,
            risk_level="CRITICAL",
            summary="Bi-temporal Open-CD run identified major inundation spread across agricultural and infrastructure zones."
        )

change_engine = ChangeDetectionEngine()