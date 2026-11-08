import { Injectable } from "@nestjs/common"
import { InjectKeycloakGateway, type KeycloakGateway, type SocialProvider } from "@modules/integrations/keycloak"
import type { Locale } from "@modules/platform/i18n"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ChallengeService } from "./challenge.service"
import { CodeMailService } from "./code-mail.service"
import type {
    ChallengePurpose,
    ChallengeView,
    CodeMailParams,
    PasswordResetInput,
    PasswordResetVerifyInput,
    ResendInput,
    ResetChallengeView,
    SignInInput,
    SignInPayload,
    SignUpInput,
    SignUpPayload,
    SocialExchangeInput,
    SocialSessionIssued,
    SocialStartInput,
    SocialStarted,
    VerifyCodeInput,
} from "./challenge.contracts"
import {
    readResetPayload,
    readSignInPayload,
    readSignUpPayload,
    toChallengeView,
    toResetChallengeView,
    toSessionTokens,
    toSignInPayload,
} from "./challenge.mapper"
import { normalizeEmail, passwordAcceptable, usernameAcceptable } from "./challenge.policy"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import { IdentityLogEvent } from "./identity.log-events"
import { identityFailure } from "./provider-failure.policy"
import type { SessionIssued } from "./session.contracts"
import { toSessionTokensOf } from "./session.mapper"
import { SessionService } from "./session.service"
import { SocialAccountService } from "./social-account.service"
import { SocialService } from "./social.service"
import { socialBindingHolds } from "./session-http.policy"

const DEFAULT_LOCALE: Locale = "vi"
const SOCIAL_PROVIDERS: ReadonlyArray<SocialProvider> = ["facebook", "github"]
const IDENTIFIER_MAX_LENGTH = 320
const SIGN_IN_PASSWORD_MAX_LENGTH = 1024
const SOCIAL_CODE_MAX_LENGTH = 4096

@Injectable()
/**
 * The learner-facing sign-in flows. Keycloak stays behind the back end: this service checks credentials there, runs
 * the emailed-code challenges, and only then creates the opaque session.
 */
export class IdentityAccessService {
    constructor(
        @InjectKeycloakGateway() private readonly gateway: KeycloakGateway,
        @InjectLogger() private readonly logger: Logger,
        private readonly challenges: ChallengeService,
        private readonly mail: CodeMailService,
        private readonly sessions: SessionService,
        private readonly social: SocialService,
        private readonly accounts: SocialAccountService,
    ) {}

    /** Checks the password at the provider and opens the email-code challenge; every credential refusal is generic. */
    async signIn(input: SignInInput): Promise<ChallengeView> {
        const identifier = input.identifier.trim()
        if (
            identifier.length === 0 ||
            identifier.length > IDENTIFIER_MAX_LENGTH ||
            input.password.length === 0 ||
            input.password.length > SIGN_IN_PASSWORD_MAX_LENGTH
        )
            throw new IdentityError({ code: IdentityErrorCode.CredentialsRejected })
        const tokens = await this.gateway.passwordGrant(identifier, input.password).catch((cause: unknown) => {
            throw identityFailure(cause, [IdentityErrorCode.CredentialsRejected])
        })
        const email = tokens.email ?? (identifier.includes("@") ? normalizeEmail(identifier) : null)
        if (email === null) throw new IdentityError({ code: IdentityErrorCode.ProviderUnavailable })
        const session = toSessionTokensOf(tokens)
        // The code goes to this address and is verified before the session exists, so it stands in when the token names none.
        return this.open("sign-in", email, input.locale, toSignInPayload({ ...session, email: session.email ?? email }))
    }

    /** Consumes the challenge with the right code and persists the session before returning its reference. */
    async verifySignIn(input: VerifyCodeInput): Promise<SessionIssued> {
        const claimed = await this.challenges.attempt("sign-in", input.challenge, input.code)
        return this.sessions.issue(toSessionTokens(readSignInPayload(claimed.payload)))
    }

    /** Rotates the code, restores the attempts and mails the new code; the expiry is unchanged. */
    async resendCode(input: ResendInput): Promise<void> {
        const rotated = await this.challenges.rotate(input.challenge)
        if (rotated.deliver)
            await this.deliver({
                email: rotated.email,
                purpose: rotated.purpose,
                locale: rotated.locale,
                code: rotated.code,
                expiresAt: rotated.expiresAt,
            })
    }

    /** Refuses a registered email, then opens the email-code challenge; no account exists until the code is verified. */
    async signUp(input: SignUpInput): Promise<ChallengeView> {
        if (!passwordAcceptable(input.password)) throw new IdentityError({ code: IdentityErrorCode.PasswordInvalid })
        if (input.username !== undefined && !usernameAcceptable(input.username))
            throw new IdentityError({ code: IdentityErrorCode.UsernameInvalid })
        const email = normalizeEmail(input.email)
        const existing = await this.gateway.findUserByEmail(email).catch((cause: unknown) => {
            throw identityFailure(cause, [])
        })
        if (existing !== null) throw new IdentityError({ code: IdentityErrorCode.EmailRegistered })
        const payload: SignUpPayload = { email, username: input.username ?? email, password: input.password }
        return this.open("sign-up", email, input.locale, payload)
    }

    /** Consumes the sign-up challenge, then creates the account, signs it in and persists the session. */
    async verifySignUp(input: VerifyCodeInput): Promise<SessionIssued> {
        const claimed = await this.challenges.attempt("sign-up", input.challenge, input.code)
        const { email, username, password } = readSignUpPayload(claimed.payload)
        await this.gateway.createUser({ email, username, password }).catch((cause: unknown) => {
            throw identityFailure(cause, [IdentityErrorCode.EmailRegistered, IdentityErrorCode.PasswordInvalid])
        })
        const tokens = await this.gateway.passwordGrant(username, password).catch((cause: unknown) => {
            throw identityFailure(cause, [])
        })
        return this.sessions.issue(toSessionTokensOf(tokens))
    }

    /** Opens a reset challenge and mails the code when the email has an account; the answer is the same either way. */
    async requestPasswordReset(input: PasswordResetInput): Promise<ResetChallengeView> {
        const email = normalizeEmail(input.email)
        const locale = input.locale ?? DEFAULT_LOCALE
        const user = await this.gateway.findUserByEmail(email).catch((cause: unknown) => {
            throw identityFailure(cause, [])
        })
        const issued = await this.challenges.issue({
            purpose: "password-reset",
            email,
            locale,
            deliver: user !== null,
            payload: { subject: user?.subject ?? null },
        })
        if (user !== null)
            await this.deliver({
                email,
                purpose: "password-reset",
                locale,
                code: issued.code,
                expiresAt: issued.expiresAt,
            })
        return toResetChallengeView(issued)
    }

    /** Consumes the reset challenge, sets the new password at the provider and revokes every session of the learner. */
    async verifyPasswordReset(input: PasswordResetVerifyInput): Promise<void> {
        if (!passwordAcceptable(input.password)) throw new IdentityError({ code: IdentityErrorCode.PasswordInvalid })
        const claimed = await this.challenges.attempt("password-reset", input.challenge, input.code)
        const { subject } = readResetPayload(claimed.payload)
        if (subject === null) throw new IdentityError({ code: IdentityErrorCode.ChallengeExpired })
        await this.gateway.resetPassword(subject, input.password).catch((cause: unknown) => {
            throw identityFailure(cause, [IdentityErrorCode.PasswordInvalid])
        })
        await this.sessions.revokeAllOf(subject)
        await this.gateway.logoutAll(subject).catch((cause: unknown) => {
            this.logger.error(IdentityLogEvent.ProviderLogoutAllFailed, cause)
        })
    }

    /** Stores a one-use PKCE bundle and answers the provider authorization URL. */
    async startSocial(input: SocialStartInput): Promise<SocialStarted> {
        const provider = SOCIAL_PROVIDERS.find((candidate) => candidate === input.provider)
        if (provider === undefined) throw new IdentityError({ code: IdentityErrorCode.ProviderUnknown })
        const bundle = await this.social.begin(input.returnTo)
        const authorizationUrl = await this.gateway
            .socialAuthorizationUrl({
                provider,
                state: bundle.state,
                nonce: bundle.nonce,
                codeChallenge: bundle.codeChallenge,
            })
            .catch((cause: unknown) => {
                throw new IdentityError({ code: IdentityErrorCode.ProviderUnavailable, cause })
            })
        return { authorizationUrl, binding: bundle.state, bindingMaxAgeSeconds: bundle.maxAgeSeconds }
    }

    /**
     * Consumes the bundle of the state, exchanges the code at the provider and persists the session. A state the
     * browser's pre-authentication cookie does not carry was started by another browser (login CSRF) and is refused before
     * the bundle is touched.
     */
    async exchangeSocial(input: SocialExchangeInput): Promise<SocialSessionIssued> {
        if (!socialBindingHolds(input.binding, input.state))
            throw new IdentityError({ code: IdentityErrorCode.SocialStateInvalid })
        const bundle = await this.social.claim(input.state)
        if (input.code.length === 0 || input.code.length > SOCIAL_CODE_MAX_LENGTH)
            throw new IdentityError({ code: IdentityErrorCode.SocialRejected })
        const tokens = await this.gateway
            .exchangeSocialCode({ code: input.code, codeVerifier: bundle.codeVerifier, nonce: bundle.nonce })
            .catch((cause: unknown) => {
                throw identityFailure(cause, [IdentityErrorCode.SocialRejected])
            })
        const username = tokens.username ?? (await this.accounts.usernameOf(tokens.email))
        return { ...(await this.sessions.issue(toSessionTokensOf({ ...tokens, username }))), returnTo: bundle.returnTo }
    }

    private async open(
        purpose: ChallengePurpose,
        email: string,
        locale: Locale | undefined,
        payload: SignInPayload | SignUpPayload,
    ): Promise<ChallengeView> {
        const language = locale ?? DEFAULT_LOCALE
        const issued = await this.challenges.issue({ purpose, email, locale: language, deliver: true, payload })
        await this.mail.send({ email, purpose, locale: language, code: issued.code, expiresAt: issued.expiresAt })
        return toChallengeView(issued, email)
    }

    private deliver(params: CodeMailParams): Promise<void> {
        const sent = this.mail.send(params)
        return params.purpose === "password-reset"
            ? sent.catch((cause: unknown) => {
                  this.logger.error(IdentityLogEvent.ResetMailFailed, cause)
              })
            : sent
    }
}
