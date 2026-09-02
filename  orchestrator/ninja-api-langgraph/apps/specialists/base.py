from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from apps.router.schemas import ImageInputMetadata


class BaseSpecialist(ABC):
    """
    Abstract base class for all SatQuery AI remote sensing specialists.
    """

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def task_type(self) -> str:
        pass

    @abstractmethod
    def execute(
        self,
        query: str,
        images: List[ImageInputMetadata],
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes inference and returns a dictionary with:
        - "text": Generated explanation / answer
        - "evidence": Visual artifacts (bounding boxes, change masks, heatmaps)
        - "duration_ms": Execution time in ms
        - "status": "Success" / "Error"
        """
        pass
