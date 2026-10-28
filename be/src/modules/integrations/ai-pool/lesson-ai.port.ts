import type { ChatCompletion, ChatCompletionChunk, ChatCompletionRequest } from "@starci/ai-router"

/** The only lesson-facing operations exposed by the shared AI pool. */
export interface LessonAi {
    /** Runs one guarded lesson completion and returns the full reply. */
    complete(input: LessonAiInput, signal?: AbortSignal): Promise<ChatCompletion>
    /** Streams one guarded lesson completion; aborting the signal cancels the routed call. */
    stream(input: LessonAiInput, signal?: AbortSignal): AsyncIterable<ChatCompletionChunk>
}

/** Prompt content is passed as messages; `grounding` is measured before it is included. */
export interface LessonAiInput {
    /** The conversation turns sent after the grounding. */
    readonly messages: NonNullable<ChatCompletionRequest["messages"]>
    /** The source text the answer is grounded on; refused when it cannot fit the smallest model window. */
    readonly grounding: string
    /** The caller's wanted output limit; capped at the configured ceiling and defaulted to it when omitted. */
    readonly max_tokens?: number
    readonly [key: string]: unknown
}
