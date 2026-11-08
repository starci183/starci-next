/** Structured, content-free telemetry event identities of the Judge0 integration; never source, input or output. */
export enum Judge0LogEvent {
    /** A call to Judge0 failed and was refused. */
    CallFailed = "judge0.call_failed",
    /** A batch was judged; fields are counts. */
    BatchJudged = "judge0.batch_judged",
}
