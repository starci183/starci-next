import { Module, type DynamicModule } from "@nestjs/common"
import {
    OIDC_BROKER,
    OIDC_TOKEN_CLIENT,
    OidcError,
    OidcModule,
    type OidcBroker,
    type OidcTokenClient,
} from "@starci/auth/oidc"
import { CLOCK, type Clock } from "@modules/platform/clock"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"
import { KeycloakError, KeycloakErrorCode } from "./errors/keycloak.error"
import { KEYCLOAK_GATEWAY } from "./keycloak.decorators"
import { toGrantTokens, toSocialTokens } from "./keycloak-tokens.mapper"
import type { KeycloakGateway, KeycloakRegistration } from "./keycloak.options"

const CODE_BY_OIDC_KIND: Readonly<Record<string, KeycloakErrorCode>> = {
    "credentials-rejected": KeycloakErrorCode.CredentialsRejected,
    unauthenticated: KeycloakErrorCode.CredentialsRejected,
    "email-registered": KeycloakErrorCode.EmailRegistered,
    "password-invalid": KeycloakErrorCode.PasswordInvalid,
    "social-rejected": KeycloakErrorCode.SocialRejected,
}

/** Translates what the OIDC package threw into this boundary's error; an error that is already ours passes, anything else is the provider being unavailable. */
const keycloakErrorOf = (cause: unknown): KeycloakError => {
    if (cause instanceof KeycloakError) return cause
    const code = cause instanceof OidcError ? CODE_BY_OIDC_KIND[cause.kind] : undefined
    return new KeycloakError({ code: code ?? KeycloakErrorCode.Unavailable, cause })
}

const translated = <T>(call: Promise<T>): Promise<T> =>
    call.catch((cause: unknown) => {
        throw keycloakErrorOf(cause)
    })

/** The package's grants and broker as the identity port: every failure leaves as this boundary's error. */
const gatewayOf = (broker: OidcBroker, grants: OidcTokenClient): KeycloakGateway => ({
    passwordGrant: (identifier, password) => translated(grants.passwordGrant(identifier, password).then(toGrantTokens)),
    refresh: (refreshToken) => translated(grants.refresh(refreshToken).then(toGrantTokens)),
    revoke: (refreshToken) => translated(broker.revoke(refreshToken)),
    socialAuthorizationUrl: (input) => translated(broker.socialAuthorizationUrl(input)),
    exchangeSocialCode: (input) => translated(broker.exchangeSocialCode(input).then(toSocialTokens)),
    createUser: (input) => translated(broker.createUser(input)),
    findUserByEmail: (email) => translated(broker.findUserByEmail(email)),
    resetPassword: (subject, password) => translated(broker.resetPassword(subject, password)),
    logoutAll: (subject) => translated(broker.logoutAll(subject)),
})

@Module({})
/** The identity provider, registered once at the app root; every provider call goes through the bounded HTTP port. */
export class KeycloakModule {
    /** Registers the OIDC package and binds the gateway port to its broker. */
    static register(options: KeycloakRegistration): DynamicModule {
        const oidc = OidcModule.registerAsync({
            isGlobal: options.isGlobal,
            inject: [HTTP_CLIENT, CLOCK],
            useFactory: (http: HttpClient, clock: Clock) => ({
                issuer: options.issuer,
                audience: options.clientId,
                client: {
                    clientId: options.clientId,
                    clientSecret: options.clientSecret,
                    callbackUri: options.socialCallbackUri,
                    // The package asks for a logout address; nothing here sends a browser to it, so the registered callback stands in.
                    postLogoutUri: options.socialCallbackUri,
                },
                timeoutMs: options.timeoutMs,
                http: {
                    request: (request) =>
                        http.request({ correlationId: "identity-keycloak", ...request }).catch((cause: unknown) => {
                            throw new KeycloakError({ code: KeycloakErrorCode.Unavailable, cause })
                        }),
                },
                clock,
            }),
        })
        return {
            module: KeycloakModule,
            global: options.isGlobal,
            imports: [oidc],
            providers: [{ provide: KEYCLOAK_GATEWAY, inject: [OIDC_BROKER, OIDC_TOKEN_CLIENT], useFactory: gatewayOf }],
            exports: [KEYCLOAK_GATEWAY, oidc],
        }
    }
}
