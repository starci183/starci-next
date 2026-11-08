import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { InterviewSourceBank, InterviewSourceFile } from "./interview.contracts"

/**
 * The port that reads interview banks from a data checkout. An object, not a bare function, so a unit spec doubles it with
 * `mock<InterviewSourceReader>()`.
 */
export interface InterviewSourceReader {
    /**
     * Lists the banks below `courses/<course>/mock-interview/` and `mock-interview-eq/` of the checkout and of the optional overlay
     * root, sorted by id.
     */
    banks(directory: string, overlay?: string): Promise<ReadonlyArray<InterviewSourceBank>>
    /**
     * Reads every file below the bank folder, with the hash of its raw bytes, sorted by path; a file of the optional overlay root
     * replaces the file of the same path or adds to them.
     */
    read(directory: string, bank: InterviewSourceBank, overlay?: string): Promise<ReadonlyArray<InterviewSourceFile>>
}

/** Token of the port that reads interview banks. */
export const INTERVIEW_SOURCE: unique symbol = Symbol("domain.interview.source")

/** Injects the port that reads interview banks. Parameter type: InterviewSourceReader. */
export const InjectInterviewSource = (): TypedParameterDecorator<InterviewSourceReader> =>
    injector<InterviewSourceReader>(INTERVIEW_SOURCE)
