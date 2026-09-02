import time
from typing import List, Dict, Any, Optional
from apps.specialists.base import BaseSpecialist
from apps.router.schemas import ImageInputMetadata


class BiTemporalSpecialistStub(BaseSpecialist):
    """
    Modular stub for Bi-Temporal Change Detection & Image Comparison.
    Reserved for plugging in the other team's ChangeDINO / STSF-Net model.
    """

    @property
    def name(self) -> str:
        return "ChangeDINO / BiTemporal Engine (Placeholder)"

    @property
    def task_type(self) -> str:
        return "change_detection"

    def execute(
        self,
        query: str,
        images: List[ImageInputMetadata],
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        start = time.time()
        t1_name = images[0].filename if len(images) > 0 else "T1_image"
        t2_name = images[1].filename if len(images) > 1 else "T2_image"

        text = (
            f"Bi-temporal comparison between Time 1 ('{t1_name}') and Time 2 ('{t2_name}'): "
            f"Significant urban expansion detected. 12 new structures were constructed in the eastern quadrant, "
            f"and 3.4 hectares of previously vegetated land have been converted to built-up surface."
        )

        evidence = {
            "change_type": "Urban Expansion",
            "changed_pixels_percentage": 14.8,
            "new_structures_detected": 12,
            "change_mask_url": "/media/change_masks/sample_diff_mask.png"
        }

        duration_ms = round((time.time() - start) * 1000, 2) + 110.0
        return {
            "text": text,
            "evidence": evidence,
            "duration_ms": duration_ms,
            "status": "Success"
        }
