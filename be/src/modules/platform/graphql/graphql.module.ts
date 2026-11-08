import { ApolloDriver, type ApolloDriverConfig } from "@nestjs/apollo"
import { Module, type DynamicModule } from "@nestjs/common"
import { GraphQLModule as NestGraphQLModule } from "@nestjs/graphql"
import { ERRORS_SERVICE, formatGraphqlError, type ErrorsService } from "@modules/platform/errors"
import { REQUEST_LOCALE, type RequestLocale } from "@modules/platform/i18n"
import { HTTP_SECURITY_OPTIONS, type HttpSecurityOptions } from "@modules/platform/http-security"
import {
    GRAPHQL_DEPTH_MAX,
    GRAPHQL_FIELDS_MAX,
    GRAPHQL_ROOT_MUTATIONS_MAX,
    type GraphqlContext,
} from "./graphql.contracts"
import { operationLimitsRule } from "./graphql-depth.policy"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./graphql.module-definition"
import { requestInvalidOf } from "./graphql-validation.mapper"
import { localizeErrorsPlugin } from "./localize-errors.mapper"

@Module({})
/**
 * The one code-first Apollo server of the api app, the same in both editions: the schema from the resolvers the feature
 * transports provide, the shared error formatter, the operation limits (depth and field count with fragments resolved,
 * one root field per mutation), introspection only where the edge policy exposes the schema (never in production), and
 * the localize plugin. A malformed operation (syntax or validation failure) is answered as the request-invalid code. The schema snapshot is `npm run contract:emit` (contracts/<app>/schema.graphql), never written at
 * boot.
 */
export class GraphqlModule extends ConfigurableModuleClass {
    /** Registers the capability once in the api app; a feature's resolvers join the schema by being providers. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            imports: [
                ...(base.imports ?? []),
                NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    inject: [ERRORS_SERVICE, REQUEST_LOCALE, HTTP_SECURITY_OPTIONS],
                    useFactory: (errors: ErrorsService, requestLocale: RequestLocale, edge: HttpSecurityOptions) => ({
                        autoSchemaFile: true,
                        sortSchema: true,
                        path: "/graphql",
                        playground: false,
                        introspection: edge.exposeSchema === true,
                        context: ({ req, res }: GraphqlContext): GraphqlContext => ({ req, res }),
                        formatError: (formatted, error) =>
                            formatGraphqlError(errors, formatted, requestInvalidOf(formatted, error) ?? error),
                        validationRules: [
                            operationLimitsRule({
                                maxDepth: GRAPHQL_DEPTH_MAX,
                                maxFields: GRAPHQL_FIELDS_MAX,
                                maxRootMutations: GRAPHQL_ROOT_MUTATIONS_MAX,
                            }),
                        ],
                        plugins: [localizeErrorsPlugin(errors, requestLocale)],
                    }),
                }),
            ],
        }
    }
}
