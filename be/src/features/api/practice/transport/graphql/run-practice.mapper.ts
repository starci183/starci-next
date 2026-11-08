import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RunPracticeRequest } from "../../application/run-practice.contracts"
import type { PracticeLanguage } from "@modules/domain/practice"
import type { PracticeLanguageWire, PracticeSolveInput } from "./dto/practice-solve.input"

const LANGUAGES: Record<PracticeLanguageWire, PracticeLanguage> = {
    CPP: "cpp",
    JAVA: "java",
    JAVASCRIPT: "javascript",
    PYTHON: "python",
    TYPESCRIPT: "typescript",
}

/** Maps the a run of the solution against the public example input and the session to the message params. */
export const toRunPracticeParams = (
    identity: IdentityPrincipal,
    input: PracticeSolveInput,
): ExecuteParams<RunPracticeRequest> => ({
    request: { slug: input.slug, language: LANGUAGES[input.language], source: input.source },
    principal: toPrincipal(identity),
})
