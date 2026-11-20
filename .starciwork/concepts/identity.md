# identity

Sign-in the Academy way: StarCi's own screen over the app's own accounts. The app signs its own access tokens; no outside identity
provider stands between the learner and the product.

## Terms
- **Account**: a row of `auth.users`, kept by the auth doors; its id is the learner id used by every domain table. Accounts that
  existed before the app owned its sign-in kept their old subject as that id.
- **Access token**: a short-lived token the app signs (public keys at `/auth/jwks`), sent as a bearer on GraphQL and REST.
- **Refresh cookie**: the HttpOnly `refresh_token` cookie of the auth doors; `GET /auth/session` answers a fresh access token from it.
- **Roles**: `teacher` and `reviewer`, the operator roles, kept in the account's `raw_user_meta_data.roles` and read on every request.
  *Not to confuse with* PREMIUM, an entitlement ([premium](premium.md)). A learner needs no role.

## Rules
1. A learner signs up with email and password; the account is usable only after the link mailed to the address is opened (confirm).
   Forgot password mails a reset link, which also confirms the mailbox and ends every session of the account.
2. Google sign-in is offered only when the app has a Google client; without it the door answers `PASSPORT_GOOGLE_UNAVAILABLE`.
3. Roles come only from the account record; anything the client sends grants nothing, and no door grants a role.
4. Refusals are generic and recoverable: sign-up, resend and forgot always answer 204 and a wrong pair or unknown email is one
   `IDENTITY_INVALID_CREDENTIALS`, so nothing reveals whether an account exists.
5. A migrated account has a confirmed email and no password: the person asks for a reset link once and sets a password.
6. After any sign-in the learner returns to the page they were on: `returnTo` is accepted only as a same-origin relative path (one
   leading `/`, no scheme, no `//`, not `/sign-in`), else `/`.
7. Signed out, the header offers sign-in through the avatar menu's modal in place; `/sign-in` stays the full page for redirects
   ([app-shell](app-shell.md)).

## Example
A learner on `/essentials/kubernetes` is asked to sign in, enters email and password in the modal, and lands back on
`/essentials/kubernetes` holding an access token and the refresh cookie.

## Don't / Instead
- Don't keep tokens in `localStorage`; the refresh token stays in the HttpOnly cookie and the access token in memory.
- Don't create accounts or grant roles outside the auth doors, except the dev seed under `scripts/integration/` and the one-off account import.

## Where
`be/src/modules/domain/identity/`, `be/src/modules/integrations/passport/`, `be/src/features/api/auth/`, `fe/apps/app/src/modules/auth/`

Related: [premium](premium.md), [verified-experience](verified-experience.md), [app-shell](app-shell.md)
