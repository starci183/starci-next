import { Injectable } from "@nestjs/common"
import { createLocalJWKSet, jwtVerify } from "jose"
import { InjectClock } from "@modules/platform/clock"
import type { Clock } from "@modules/platform/clock"
import { InjectHttpClient } from "@modules/platform/http"
import type { HttpClient } from "@modules/platform/http"
import { isRecord } from "@modules/platform/primitives"
import { KeycloakError, KeycloakErrorCode } from "./errors/keycloak.error"
import type { KeycloakAuthorization, KeycloakExchange, KeycloakIdentity, KeycloakMetadata } from "./keycloak.contracts"
import { InjectKeycloakOptions } from "./keycloak.decorators"
import type { KeycloakOptions } from "./keycloak.options"
import { isKeycloakJwks, readKeycloakIdentity, readKeycloakMetadata } from "./keycloak.policy"

@Injectable()
/** Speaks the provider protocol through the bounded HTTP port; never returns or logs a provider token. */
export class KeycloakClient {
    constructor(
        @InjectHttpClient() private readonly http: HttpClient,
        @InjectClock() private readonly clock: Clock,
        @InjectKeycloakOptions() private readonly options: KeycloakOptions,
    ) {}

    /** Constructs the registered code flow with mandatory nonce and S256 challenge. */
    async authorization(input: KeycloakAuthorization): Promise<string> {
        const metadata = await this.discovery()
        const url = new URL(metadata.authorizationEndpoint)
        url.search = new URLSearchParams({
            response_type: "code",
            client_id: this.options.clientId,
            redirect_uri: this.options.callbackUri,
            scope: "openid",
            state: input.state,
            nonce: input.nonce,
            code_challenge: input.challenge,
            code_challenge_method: "S256",
        }).toString()
        return url.toString()
    }

    /** Exchanges a claimed code once, then verifies the signature, issuer, audience, expiry and browser nonce. */
    async exchange(input: KeycloakExchange): Promise<KeycloakIdentity> {
        if (input.issuer !== undefined && input.issuer !== this.options.issuer)
            throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
        const metadata = await this.discovery()
        const token = await this.http
            .request({
                correlationId: "identity-keycloak",
                method: "POST",
                url: metadata.tokenEndpoint,
                timeoutMs: this.options.timeoutMs,
                form: {
                    grant_type: "authorization_code",
                    client_id: this.options.clientId,
                    client_secret: this.options.clientSecret.reveal(),
                    redirect_uri: this.options.callbackUri,
                    code: input.code,
                    code_verifier: input.verifier,
                },
            })
            .catch((cause: unknown) => {
                throw new KeycloakError({ code: KeycloakErrorCode.Unavailable, cause })
            })
        if (token.status !== 200 || !isRecord(token.body) || typeof token.body.id_token !== "string")
            throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
        const jwks = await this.read(metadata.jwksUri)
        if (!isKeycloakJwks(jwks)) throw new KeycloakError({ code: KeycloakErrorCode.Rejected })
        const verified = await jwtVerify(token.body.id_token, createLocalJWKSet(jwks), {
            algorithms: ["RS256"],
            issuer: this.options.issuer,
            audience: this.options.clientId,
            requiredClaims: ["sub", "exp", "nonce"],
            currentDate: this.clock.now(),
        }).catch((cause: unknown) => {
            throw new KeycloakError({ code: KeycloakErrorCode.Rejected, cause })
        })
        return readKeycloakIdentity(verified.payload, this.options.issuer, input.nonce)
    }

    /** Builds RP-Initiated Logout without retaining or sending an ID-token hint. */
    async logout(): Promise<string> {
        const metadata = await this.discovery()
        const url = new URL(metadata.logoutEndpoint)
        url.search = new URLSearchParams({
            client_id: this.options.clientId,
            post_logout_redirect_uri: this.options.postLogoutUri,
        }).toString()
        return url.toString()
    }

    private async discovery(): Promise<KeycloakMetadata> {
        const value = await this.read(`${this.options.issuer.replace(/\/$/, "")}/.well-known/openid-configuration`)
        return readKeycloakMetadata(value, this.options.issuer)
    }

    private async read(url: string): Promise<unknown> {
        const response = await this.http
            .request({
                correlationId: "identity-keycloak",
                method: "GET",
                url,
                timeoutMs: this.options.timeoutMs,
            })
            .catch((cause: unknown) => {
                throw new KeycloakError({ code: KeycloakErrorCode.Unavailable, cause })
            })
        if (response.status !== 200) throw new KeycloakError({ code: KeycloakErrorCode.Unavailable })
        return response.body
    }
}
