import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitPracticeRequest } from "../../application/submit-practice.contracts"
import type { PracticeLanguage } from "@modules/domain/practice"
import type { PracticeLanguageWire, PracticeSolveInput } from "./dto/practice-solve.input"

const LANGUAGES: Record<PracticeLanguageWire, PracticeLanguage> = {
    CPP: "cpp",
    JAVA: "java",
    JAVASCRIPT: "javascript",
    PYTHON: "python",
    TYPESCRIPT: "typescript",
}

/** Maps the a submit of the solution against every test input and the session to the message params. */
export const toSubmitPracticeParams = (
    identity: IdentityPrincipal,
    input: PracticeSolveInput,
): ExecuteParams<SubmitPracticeRequest> => ({
    request: { slug: input.slug, language: LANGUAGES[input.language], source: input.source },
    principal: toPrincipal(identity),
})
