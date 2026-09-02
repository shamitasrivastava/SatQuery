import re
from typing import List, Optional
from apps.router.schemas import TaskTypeEnum, RoutingDecision, ImageInputMetadata


# Keyword lexicons with task weights
CHANGE_KEYWORDS = [
    r"\bchange\b", r"\bchanged\b", r"\bchanges\b", r"\bdifference\b", r"\bdifferences\b",
    r"\bcompared to\b", r"\bcompare\b", r"\bbefore and after\b", r"\btemporal\b",
    r"\bnew construction\b", r"\bdemolished\b", r"\burban growth\b", r"\bexpansion\b",
    r"\bdeforestation\b", r"\bflooded between\b", r"\bdamage after\b", r"\bpre-event\b",
    r"\bpost-event\b", r"\bbetween the two\b", r"\bt1 and t2\b", r"\bover time\b",
    r"\bbuilt between\b", r"\bconstructed between\b", r"\bbetween \d{4} and \d{4}\b",
    r"\bbetween \d{4}\b"
]

GROUNDING_KEYWORDS = [
    r"\[identify\]", r"\bwhere is\b", r"\bwhere are\b", r"\bshow me where\b", r"\blocate\b",
    r"\bfind the\b", r"\bbounding box\b", r"\bcoordinates\b", r"\bshow me the position\b",
    r"\bdetect and locate\b", r"\bpoint to\b", r"\bhighlight the\b", r"\bwhere .* located\b",
    r"\bexact location\b", r"\blocation of\b"
]

CLASSIFICATION_KEYWORDS = [
    r"\bclassify the image\b", r"\bclassify this\b", r"\bwhat type of scene\b",
    r"\bscene classification\b", r"\bcategory of this\b", r"\bland cover class\b",
    r"\bwhich class does this belong\b"
]

VQA_KEYWORDS = [
    r"\bwhat is\b", r"\bwhat are\b", r"\bhow many\b", r"\bcount\b", r"\bis there\b",
    r"\bare there\b", r"\bdescribe\b", r"\bwhat do you see\b", r"\bwhat does this image show\b",
    r"\bexplain\b", r"\bis this\b", r"\bhow much\b"
]


class SmartTaskRouter:
    """
    Intelligent Agentic Task Router and Dispatcher.
    Parses natural language query intent, validates input context,
    computes confidence, and determines the optimal specialist tool.
    """

    @classmethod
    def analyze_intent(cls, query: str) -> tuple[TaskTypeEnum, float, str]:
        """
        Analyzes the query and returns (TaskTypeEnum, confidence, reasoning).
        """
        q = query.strip().lower()

        # Check explicit [identify] tag first
        if "[identify]" in q:
            return TaskTypeEnum.OBJECT_GROUNDING, 0.98, "Explicit [identify] grounding tag found in query."

        # Compute match scores for each task
        change_matches = sum(1 for kw in CHANGE_KEYWORDS if re.search(kw, q))
        grounding_matches = sum(1 for kw in GROUNDING_KEYWORDS if re.search(kw, q))
        class_matches = sum(1 for kw in CLASSIFICATION_KEYWORDS if re.search(kw, q))
        vqa_matches = sum(1 for kw in VQA_KEYWORDS if re.search(kw, q))

        # Check Change Detection (temporal comparisons take precedence over single-word spatial cues)
        if change_matches > 0:
            confidence = min(0.88 + (change_matches * 0.04), 0.98)
            return TaskTypeEnum.CHANGE_DETECTION, round(confidence, 2), f"Query contains {change_matches} temporal change indicators."

        # Check Grounding
        if grounding_matches > 0:
            confidence = min(0.88 + (grounding_matches * 0.04), 0.98)
            return TaskTypeEnum.OBJECT_GROUNDING, round(confidence, 2), f"Query requests spatial localization/coordinates ({grounding_matches} markers)."

        # Check Scene Classification
        if class_matches > 0:
            confidence = min(0.88 + (class_matches * 0.04), 0.96)
            return TaskTypeEnum.SCENE_CLASSIFICATION, round(confidence, 2), f"Query requests discrete scene category classification."

        # Check General VQA
        if vqa_matches > 0:
            confidence = min(0.84 + (vqa_matches * 0.04), 0.95)
            return TaskTypeEnum.VQA, round(confidence, 2), f"Query contains visual question answering patterns ({vqa_matches} matches)."

        # Default fallback for arbitrary question/instruction
        if len(q) > 0 and ("?" in q or any(w in q for w in ["image", "satellite", "airport", "building", "water", "ship"])):
            return TaskTypeEnum.VQA, 0.78, "Query represents general visual understanding/question."

        return TaskTypeEnum.UNSUPPORTED, 0.40, "Query intent is ambiguous or unclassifiable."

    @classmethod
    def route(cls, query: str, images: Optional[List[ImageInputMetadata]] = None) -> RoutingDecision:
        """
        Determines task, selects model, and checks input compatibility.
        """
        img_count = len(images) if images else 1
        task, confidence, reason = cls.analyze_intent(query)

        # Map task to specialist model
        if task == TaskTypeEnum.CHANGE_DETECTION:
            model = "ChangeDINO / BiTemporal-Engine"
            # Validate input compatibility (requires at least 2 images)
            if img_count < 2:
                return RoutingDecision(
                    task=task,
                    model=model,
                    confidence=confidence,
                    reason=reason,
                    input_valid=False,
                    error_message=f"Change Detection task requires at least 2 temporal images (Before & After). Received {img_count} image."
                )
            return RoutingDecision(
                task=task,
                model=model,
                confidence=confidence,
                reason=reason,
                input_valid=True
            )

        elif task == TaskTypeEnum.OBJECT_GROUNDING:
            model = "Grounded GeoChat-7B"
            return RoutingDecision(
                task=task,
                model=model,
                confidence=confidence,
                reason=reason,
                input_valid=True
            )

        elif task in [TaskTypeEnum.VQA, TaskTypeEnum.SCENE_CLASSIFICATION]:
            model = "GeoChat-7B"
            return RoutingDecision(
                task=task,
                model=model,
                confidence=confidence,
                reason=reason,
                input_valid=True
            )

        else:
            return RoutingDecision(
                task=TaskTypeEnum.UNSUPPORTED,
                model="None",
                confidence=confidence,
                reason=reason,
                input_valid=False,
                error_message="Could not determine supported remote sensing task for this query."
            )
