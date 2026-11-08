import { GraphQLError, type GraphQLFormattedError } from "graphql"
import type { ErrorsService } from "./errors.service"

/**
 * The one GraphQL error formatter: a failure thrown by a resolver or a guard becomes `errors[].extensions.{code,kind,params}`
 * through the errors service (a declared code keeps its code, anything else is masked as internal; the graphql module turns
 * a malformed operation into its request-invalid error before it gets here). The message of a coded error is the code until
 * the localize plugin replaces it with the catalog text.
 */
export const formatGraphqlError = (
    errors: ErrorsService,
    formatted: GraphQLFormattedError,
    error: unknown,
): GraphQLFormattedError => {
    const description = errors.describe(error instanceof GraphQLError ? error.originalError : error)
    return {
        message: description.code,
        ...(formatted.locations === undefined ? {} : { locations: formatted.locations }),
        ...(formatted.path === undefined ? {} : { path: formatted.path }),
        extensions: { code: description.code, kind: description.kind, params: description.params },
    }
}
