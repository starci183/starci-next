/** Events the identity capability records; fields are never a password, code, token or provider text. */
export enum IdentityLogEvent {
    /** The password-reset mail failed; the answer to the learner stays the same as for an unknown email. */
    ResetMailFailed = "identity.reset_mail_failed",
    /** The provider could not revoke a refresh token after local sign-out; the session is already revoked here. */
    ProviderRevokeFailed = "identity.provider_revoke_failed",
    /** The provider could not end its sessions after a password reset; local sessions are already revoked. */
    ProviderLogoutAllFailed = "identity.provider_logout_all_failed",
    /** The provider was unreachable during a token refresh; the session continues until its recorded end. */
    RefreshUnavailable = "identity.refresh_unavailable",
    /** The provider could not name the account of a social sign-in; the session is issued without a name. */
    AccountLookupFailed = "identity.account_lookup_failed",
}
