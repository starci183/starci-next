import type { PathLocale } from "@modules/domain/path"

/** What the outcome paths query is asked. */
export interface OutcomePathsRequest {
    /** The locale of the texts. */
    readonly locale: PathLocale
}

/** What choosing a path is asked. */
export interface ChooseOutcomePathRequest {
    /** The path to follow. */
    readonly pathId: string
}
