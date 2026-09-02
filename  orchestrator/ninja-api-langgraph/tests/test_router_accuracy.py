import pytest
from apps.router.smart_algorithm import SmartTaskRouter
from apps.router.schemas import TaskTypeEnum, ImageInputMetadata


BENCHMARK_EVAL_DATASET = [
    # Single-Image VQA
    ("How many airplanes are visible in the image?", TaskTypeEnum.VQA),
    ("What is shown in this satellite scene?", TaskTypeEnum.VQA),
    ("Are there any ships docked in the harbor?", TaskTypeEnum.VQA),
    ("Describe the land cover in this image.", TaskTypeEnum.VQA),
    ("How many buildings are flooded?", TaskTypeEnum.VQA),
    ("Is this an airport or a train station?", TaskTypeEnum.VQA),
    ("What do you see in the center of the image?", TaskTypeEnum.VQA),
    ("Count the storage tanks present in the facility.", TaskTypeEnum.VQA),
    ("Why is the water area discolored?", TaskTypeEnum.VQA),
    ("What does this image show near the shoreline?", TaskTypeEnum.VQA),

    # Object Grounding / Localization
    ("[identify] what is this <8><26><22><37>", TaskTypeEnum.OBJECT_GROUNDING),
    ("Where are the airplanes located and what is their type?", TaskTypeEnum.OBJECT_GROUNDING),
    ("Locate the runway in this image.", TaskTypeEnum.OBJECT_GROUNDING),
    ("Show me the bounding box coordinates for the bridge.", TaskTypeEnum.OBJECT_GROUNDING),
    ("Find the solar panels in this agricultural region.", TaskTypeEnum.OBJECT_GROUNDING),
    ("Detect and locate all industrial storage tanks.", TaskTypeEnum.OBJECT_GROUNDING),
    ("Where is the hospital located in this urban scene?", TaskTypeEnum.OBJECT_GROUNDING),
    ("Highlight the tennis courts in this recreational area.", TaskTypeEnum.OBJECT_GROUNDING),
    ("Show me where the flooded buildings are located.", TaskTypeEnum.OBJECT_GROUNDING),
    ("[identify] locate the vessel <15><40><30><60>", TaskTypeEnum.OBJECT_GROUNDING),

    # Bi-Temporal Change Detection
    ("What changed between these two satellite images?", TaskTypeEnum.CHANGE_DETECTION),
    ("Show me the difference between the 2024 and 2025 images.", TaskTypeEnum.CHANGE_DETECTION),
    ("How much new construction occurred compared to last year?", TaskTypeEnum.CHANGE_DETECTION),
    ("Analyze the urban growth between these two temporal scenes.", TaskTypeEnum.CHANGE_DETECTION),
    ("What is the flood damage after the hurricane compared to pre-event?", TaskTypeEnum.CHANGE_DETECTION),
    ("Identify changes in forest cover over time.", TaskTypeEnum.CHANGE_DETECTION),
    ("Did any buildings get demolished between T1 and T2?", TaskTypeEnum.CHANGE_DETECTION),
    ("Detect land expansion between the two dates.", TaskTypeEnum.CHANGE_DETECTION),
    ("What are the differences in vegetation between these images?", TaskTypeEnum.CHANGE_DETECTION),
    ("Find the new roads built between 2020 and 2025.", TaskTypeEnum.CHANGE_DETECTION),

    # Scene Classification
    ("Classify the image in the following classes: Church, Beach, Dense Residential.", TaskTypeEnum.SCENE_CLASSIFICATION),
    ("What type of scene is represented in this image?", TaskTypeEnum.SCENE_CLASSIFICATION),
    ("Classify this satellite photo into land cover category.", TaskTypeEnum.SCENE_CLASSIFICATION),
]


def test_task_planning_accuracy_benchmark():
    """
    Evaluates Smart Task Router against the 33-query benchmark dataset.
    Target: Task Planning Accuracy > 85% (per ISRO/SAC SIH requirement).
    """
    correct = 0
    total = len(BENCHMARK_EVAL_DATASET)
    results = []

    for query, expected_task in BENCHMARK_EVAL_DATASET:
        decision = SmartTaskRouter.route(query)
        is_correct = decision.task == expected_task
        if is_correct:
            correct += 1
        results.append((query, expected_task.value, decision.task.value, decision.confidence, is_correct))

    accuracy = (correct / total) * 100
    print(f"\n=======================================================")
    print(f"BENCHMARK RESULTS: {correct}/{total} Correct ({accuracy:.2f}%)")
    print(f"Target: > 85.0%")
    print(f"=======================================================")

    for q, exp, pred, conf, ok in results:
        status = "[PASS]" if ok else "[FAIL]"
        print(f"{status} | Expected: {exp:20} | Pred: {pred:20} | Conf: {conf:.2f} | '{q}'")

    assert accuracy >= 85.0, f"Task planning accuracy {accuracy:.2f}% is below target 85%"


def test_input_compatibility_rejection():
    """
    Tests that Change Detection with only 1 image is identified correctly
    but rejected as input_valid=False with clear diagnostic message.
    """
    single_img = [ImageInputMetadata(id="img_1", filename="optical_single.png")]
    decision = SmartTaskRouter.route("What changed between these images?", single_img)
    
    assert decision.task == TaskTypeEnum.CHANGE_DETECTION
    assert decision.input_valid is False
    assert "requires at least 2 temporal images" in decision.error_message


def test_grounding_tag_priority():
    """
    Tests explicit [identify] tag generates near-certainty confidence (>0.95).
    """
    decision = SmartTaskRouter.route("[identify] what is this <10><20><30><40>")
    assert decision.task == TaskTypeEnum.OBJECT_GROUNDING
    assert decision.confidence >= 0.95
