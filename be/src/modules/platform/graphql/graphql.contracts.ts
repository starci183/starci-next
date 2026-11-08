import type { Request, Response } from "express"
import type { CorrelationRequest } from "@modules/platform/logging"

/** The GraphQL context every operation runs with: the HTTP request it arrived on and its response. */
export interface GraphqlContext {
    /** The HTTP request: the guards read its headers and the principal they establish on it. */
    readonly req: Request & CorrelationRequest
    /** The HTTP response. */
    readonly res: Response
}

/** The deepest field nesting an operation may have, fragments resolved. */
export const GRAPHQL_DEPTH_MAX = 10

/**
 * The most fields one operation may select, every alias and every use of a fragment counted. The largest operation the
 * learner app sends selects under 80, so the bound leaves room while an aliased flood of one field is refused.
 */
export const GRAPHQL_FIELDS_MAX = 300

/** The most root fields one mutation may select: each is a write, so a batch of aliased checkouts is refused. */
export const GRAPHQL_ROOT_MUTATIONS_MAX = 1
