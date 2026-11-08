import { KeycloakErrorCode } from "@modules/integrations/keycloak"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"

const IDENTITY_CODE_BY_PROVIDER_CODE: Readonly<Record<string, IdentityErrorCode>> = {
    [KeycloakErrorCode.CredentialsRejected]: IdentityErrorCode.CredentialsRejected,
    [KeycloakErrorCode.EmailRegistered]: IdentityErrorCode.EmailRegistered,
    [KeycloakErrorCode.PasswordInvalid]: IdentityErrorCode.PasswordInvalid,
    [KeycloakErrorCode.SocialRejected]: IdentityErrorCode.SocialRejected,
    [KeycloakErrorCode.Unavailable]: IdentityErrorCode.ProviderUnavailable,
}

/** The stable code of a failure that carries one, or undefined for anything else. */
export const codeOf = (cause: unknown): string | undefined =>
    typeof cause === "object" && cause !== null && "code" in cause && typeof cause.code === "string"
        ? cause.code
        : undefined

/** True when the provider could not be reached, as opposed to refusing the request. */
export const providerUnreachable = (cause: unknown): boolean => codeOf(cause) === KeycloakErrorCode.Unavailable

/**
 * Turns a provider failure into the identity error of one operation. Only the codes the operation `allows` keep their
 * meaning; every other failure, including a non-provider one, is `ProviderUnavailable`. The cause is kept for the log.
 */
export const identityFailure = (cause: unknown, allows: ReadonlyArray<IdentityErrorCode>): IdentityError => {
    const mapped = IDENTITY_CODE_BY_PROVIDER_CODE[codeOf(cause) ?? ""]
    return new IdentityError({
        code: mapped !== undefined && allows.includes(mapped) ? mapped : IdentityErrorCode.ProviderUnavailable,
        cause,
    })
}
