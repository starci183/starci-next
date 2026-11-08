import type { Judge0CaseResult, Judge0RunRequest } from "./judge0.contracts"

/** The code judge: runs one program against a list of tests. Fails with a `Judge0Error`. */
export interface Judge0Gateway {
    /** Judges every test of the request and answers one result per test, in order. */
    run(request: Judge0RunRequest): Promise<ReadonlyArray<Judge0CaseResult>>
}
