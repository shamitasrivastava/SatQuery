from typing import Dict, Optional
from apps.router.schemas import TaskTypeEnum
from apps.specialists.base import BaseSpecialist
from apps.specialists.geochat_specialist import GeoChatSpecialist
from apps.specialists.bitemporal_specialist import BiTemporalSpecialist


class SpecialistToolRegistry:
    """
    Registry for managing and dispatching remote sensing specialist tools.
    """
    _registry: Dict[str, BaseSpecialist] = {}

    @classmethod
    def initialize(cls):
        if not cls._registry:
            geochat_service = GeoChatSpecialist()
            bitemporal_service = BiTemporalSpecialist()
            cls._registry = {
                TaskTypeEnum.VQA.value: geochat_service,
                TaskTypeEnum.OBJECT_GROUNDING.value: geochat_service,
                TaskTypeEnum.SCENE_CLASSIFICATION.value: geochat_service,
                TaskTypeEnum.CHANGE_DETECTION.value: bitemporal_service,
            }

    @classmethod
    def get_specialist(cls, task_type: TaskTypeEnum) -> Optional[BaseSpecialist]:
        cls.initialize()
        return cls._registry.get(task_type.value)

    @classmethod
    def list_available_tools(cls) -> Dict[str, str]:
        cls.initialize()
        return {task: spec.name for task, spec in cls._registry.items()}
