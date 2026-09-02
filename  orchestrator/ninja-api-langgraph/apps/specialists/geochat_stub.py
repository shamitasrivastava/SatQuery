import time
from typing import List, Dict, Any, Optional
from apps.specialists.base import BaseSpecialist
from apps.router.schemas import ImageInputMetadata


class GeoChatSpecialistStub(BaseSpecialist):
    """
    Modular stub for Single-Image VQA & Object Grounding.
    To be wired directly to the active GeoChat-7B model in Phase 2.
    """

    @property
    def name(self) -> str:
        return "GeoChat-7B (VQA & Grounding Specialist)"

    @property
    def task_type(self) -> str:
        return "vqa_and_grounding"

    def execute(
        self,
        query: str,
        images: List[ImageInputMetadata],
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        start = time.time()
        q_lower = query.lower()

        # Simulated response tailored to remote-sensing domains
        if "airplane" in q_lower or "plane" in q_lower:
            text = "There are a total of 2 airplanes visible in the satellite scene located near the main runway."
            evidence = {
                "bboxes": [
                    {"label": "airplane", "box_2d": [120, 240, 195, 310]},
                    {"label": "airplane", "box_2d": [340, 480, 410, 560]}
                ],
                "grounding_count": 2
            }
        elif "flood" in q_lower or "water" in q_lower or "building" in q_lower:
            text = "Analysis indicates 15 building structures affected by inundation in the residential sector."
            evidence = {
                "bboxes": [
                    {"label": "flooded_building", "box_2d": [85, 140, 160, 220]}
                ],
                "grounding_count": 1
            }
        elif "[identify]" in q_lower:
            text = "The selected region corresponds to an industrial storage tank facility."
            evidence = {
                "detected_class": "storage_tank",
                "coordinates": [8, 26, 22, 37]
            }
        else:
            text = f"Remote sensing analysis of image '{images[0].filename if images else 'input'}': The scene represents an urban and transportation infrastructure area with well-defined road networks and commercial zones."
            evidence = {"scene_classes": ["Urban", "Infrastructure", "Roadways"]}

        duration_ms = round((time.time() - start) * 1000, 2) + 85.0
        return {
            "text": text,
            "evidence": evidence,
            "duration_ms": duration_ms,
            "status": "Success"
        }
