import type { GraphQLFormattedError } from "graphql"
import { HttpSecurityError, HttpSecurityErrorCode } from "@modules/platform/http-security"

/** The codes Apollo and graphql-js give a malformed operation: a syntax error, a validation rule or a variable that does not coerce. */
const MALFORMED_OPERATION_CODES: ReadonlySet<string> = new Set([
    "GRAPHQL_PARSE_FAILED",
    "GRAPHQL_VALIDATION_FAILED",
    "BAD_USER_INPUT",
])

/** What the request-invalid text names for a malformed operation: never the offending field, because graphql-js echoes schema detail with it. */
const OPERATION_FIELD = "operation"

const codeOf = (value: unknown): unknown => {
    if (typeof value !== "object" || value === null || !("extensions" in value)) return undefined
    const { extensions } = value
    return typeof extensions === "object" && extensions !== null && "code" in extensions ? extensions.code : undefined
}

/**
 * The request-invalid error of a malformed operation (syntax error, unknown field, wrong or missing argument), or
 * `undefined` for any other failure. Its message and hints ("Did you mean ...") never travel: only the code, the kind
 * `invalid` and a neutral field name do.
 */
export const requestInvalidOf = (formatted: GraphQLFormattedError, error: unknown): HttpSecurityError | undefined => {
    const code = codeOf(formatted) ?? codeOf(error)
    if (typeof code !== "string" || !MALFORMED_OPERATION_CODES.has(code)) return undefined
    return new HttpSecurityError({
        code: HttpSecurityErrorCode.RequestInvalid,
        params: { fields: OPERATION_FIELD },
        cause: error,
    })
}
