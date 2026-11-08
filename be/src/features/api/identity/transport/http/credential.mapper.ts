import type { ChallengeView, ResetChallengeView, SocialStarted } from "@modules/domain/identity"
import type { Locale } from "@modules/platform/i18n"
import type { SignInRequest } from "./dto/sign-in.request"
import type { SignInVerifyRequest } from "./dto/sign-in-verify.request"
import type { ChallengeResendRequest } from "./dto/challenge-resend.request"
import type { SignUpRequest } from "./dto/sign-up.request"
import type { SignUpVerifyRequest } from "./dto/sign-up-verify.request"
import type { PasswordResetRequest } from "./dto/password-reset.request"
import type { PasswordResetVerifyRequest } from "./dto/password-reset-verify.request"
import type { SocialStartRequest } from "./dto/social-start.request"
import type { SocialExchangeRequest } from "./dto/social-exchange.request"
import type { SignInRequest as SignInCommandRequest } from "../../application/sign-in.contracts"
import type { VerifySignInRequest } from "../../application/verify-sign-in.contracts"
import type { ResendCodeRequest } from "../../application/resend-code.contracts"
import type { SignUpRequest as SignUpCommandRequest } from "../../application/sign-up.contracts"
import type { VerifySignUpRequest } from "../../application/verify-sign-up.contracts"
import type { RequestPasswordResetRequest } from "../../application/request-password-reset.contracts"
import type { VerifyPasswordResetRequest } from "../../application/verify-password-reset.contracts"
import type { StartSocialRequest } from "../../application/start-social.contracts"
import type { ExchangeSocialRequest } from "../../application/exchange-social.contracts"
import type { PasswordResetResponse } from "./dto/password-reset.response"
import type { SignInResponse } from "./dto/sign-in.response"
import type { SignUpResponse } from "./dto/sign-up.response"
import type { SocialStartResponse } from "./dto/social-start.response"

/** Maps the validated SignInRequest body to its application request. */
export const toSignInRequest = (body: SignInRequest, locale: Locale): SignInCommandRequest => ({
    identifier: body.identifier,
    password: body.password,
    locale,
})

/** Maps the validated SignInVerifyRequest body to its application request. */
export const toVerifySignInRequest = (body: SignInVerifyRequest): VerifySignInRequest => ({
    challenge: body.challenge,
    code: body.code,
})

/** Maps the validated ChallengeResendRequest body to its application request. */
export const toResendCodeRequest = (body: ChallengeResendRequest): ResendCodeRequest => ({ challenge: body.challenge })

/** Maps the validated SignUpRequest body to its application request. */
export const toSignUpRequest = (body: SignUpRequest, locale: Locale): SignUpCommandRequest => ({
    ...body,
    locale,
})

/** Maps the validated SignUpVerifyRequest body to its application request. */
export const toVerifySignUpRequest = (body: SignUpVerifyRequest): VerifySignUpRequest => ({
    challenge: body.challenge,
    code: body.code,
})

/** Maps the validated PasswordResetRequest body to its application request. */
export const toRequestPasswordResetRequest = (
    body: PasswordResetRequest,
    locale: Locale,
): RequestPasswordResetRequest => ({
    email: body.email,
    locale,
})

/** Maps the validated PasswordResetVerifyRequest body to its application request. */
export const toVerifyPasswordResetRequest = (body: PasswordResetVerifyRequest): VerifyPasswordResetRequest => ({
    challenge: body.challenge,
    code: body.code,
    password: body.password,
})

/** Maps the validated SocialStartRequest body to its application request. */
export const toStartSocialRequest = (body: SocialStartRequest): StartSocialRequest => ({ ...body })

/** Maps the validated SocialExchangeRequest body and the browser's social binding to its application request. */
export const toExchangeSocialRequest = (
    body: SocialExchangeRequest,
    binding: string | undefined,
): ExchangeSocialRequest => ({
    code: body.code,
    state: body.state,
    binding,
})

/** Answers the challenge with an RFC3339 expiry; the domain already masked the email. */
export const toChallengeResponse = (view: ChallengeView): SignInResponse & SignUpResponse => ({
    challenge: view.challenge,
    email: view.email,
    expiresAt: view.expiresAt.toISOString(),
})

/** Answers the reset challenge, the same shape for registered and unknown emails. */
export const toResetResponse = (view: ResetChallengeView): PasswordResetResponse => ({
    challenge: view.challenge,
    expiresAt: view.expiresAt.toISOString(),
})

/** Answers only the provider URL; the PKCE bundle stays server-side. */
export const toSocialStartResponse = (view: SocialStarted): SocialStartResponse => ({
    authorizationUrl: view.authorizationUrl,
})
