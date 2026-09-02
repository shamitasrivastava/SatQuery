import datetime
from typing import List, Optional
from apps.router.schemas import TraceEvent, ExecutionTrace, RoutingDecision, ImageInputMetadata


class TraceEngine:
    """
    Constructs structured, auditable execution traces for every transaction.
    """

    def __init__(self, request_id: str, user_query: str):
        self.request_id = request_id
        self.user_query = user_query
        self.events: List[TraceEvent] = []
        self.start_time = datetime.datetime.utcnow()

    def add_step(
        self,
        step: int,
        event: str,
        status: str,
        details: str,
        task: Optional[str] = None,
        model_tool: Optional[str] = None,
        confidence: Optional[float] = None,
        duration_ms: Optional[float] = None
    ) -> TraceEvent:
        now_str = datetime.datetime.utcnow().isoformat() + "Z"
        ev = TraceEvent(
            step=step,
            timestamp=now_str,
            event=event,
            status=status,
            task=task,
            model_tool=model_tool,
            confidence=confidence,
            details=details,
            duration_ms=duration_ms
        )
        self.events.append(ev)
        return ev

    def build_trace(self, final_status: str, summary: str) -> ExecutionTrace:
        end_time = datetime.datetime.utcnow()
        total_duration = round((end_time - self.start_time).total_seconds() * 1000, 2)
        return ExecutionTrace(
            request_id=self.request_id,
            status=final_status,
            user_query=self.user_query,
            total_duration_ms=total_duration,
            events=self.events,
            summary=summary
        )

    @classmethod
    def create_standard_trace(
        cls,
        request_id: str,
        query: str,
        images: List[ImageInputMetadata],
        decision: RoutingDecision,
        exec_status: str,
        result_details: str,
        exec_duration_ms: float = 120.0
    ) -> ExecutionTrace:
        """
        Creates a standard 6-step trace lifecycle.
        """
        engine = cls(request_id, query)

        # Step 1: Query Received
        engine.add_step(
            step=1,
            event="Query Received",
            status="Success",
            details=f"Query successfully received and parsed ({len(query)} characters)."
        )

        # Step 2: Task Identification
        engine.add_step(
            step=2,
            event="Task Identification",
            status="Success" if decision.task.value != "unsupported" else "Warning",
            task=decision.task.value,
            confidence=decision.confidence,
            details=f"Selected Task: {decision.task.value}. Reason: {decision.reason}"
        )

        # Step 3: Input Validation
        val_status = "Success" if decision.input_valid else "Error"
        img_info = f"{len(images)} image(s) provided: " + ", ".join([f"{img.filename} ({img.format}/{img.modality})" for img in images]) if images else "No images"
        engine.add_step(
            step=3,
            event="Input Validation",
            status=val_status,
            details=img_info if decision.input_valid else f"Incompatible: {decision.error_message}"
        )

        # Step 4: Tool Selection
        engine.add_step(
            step=4,
            event="Tool Selection",
            status="Success" if decision.input_valid else "Skipped",
            model_tool=decision.model,
            details=f"Selected Specialist: {decision.model}." if decision.input_valid else "Tool execution skipped due to input validation error."
        )

        # Step 5: Model Execution
        engine.add_step(
            step=5,
            event="Model Execution",
            status=exec_status,
            model_tool=decision.model,
            duration_ms=exec_duration_ms,
            details=f"Executed with specialist tool '{decision.model}'." if exec_status == "Success" else f"Execution failed or skipped: {decision.error_message or 'Error'}"
        )

        # Step 6: Result Generation
        engine.add_step(
            step=6,
            event="Result Generation",
            status=exec_status,
            details=result_details
        )

        summary_msg = (
            f"[Task: {decision.task.value} (Confidence: {int(decision.confidence*100)}%)] "
            f"[Tool: {decision.model}] "
            f"[Status: {exec_status}] "
            f"[Duration: {exec_duration_ms}ms]"
        )
        return engine.build_trace(final_status=exec_status, summary=summary_msg)
