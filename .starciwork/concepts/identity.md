# identity

Sign-in the Academy way: StarCi's own screen, with Keycloak hidden behind the backend (owner). The learner never sees a Keycloak page,
and identity exists only after the backend verifies Keycloak's answer.

## Terms
- **Realm**: `starci-next-identity`.
- **Session**: an opaque application session stored server-side with the Keycloak refresh token; the browser holds only the HttpOnly
  `__Host-identity_session` cookie.
- **Roles**: TEACHER and REVIEWER (operator roles from Keycloak's verified claims). *Not to confuse with* PREMIUM, an entitlement
  ([premium](premium.md)). A learner needs no role.

## Rules
1. A learner signs in with email or username and password, or with Facebook or GitHub. A password sign-in completes only after the
   6-digit code mailed to the account is entered.
2. Social sign-in brokers through Keycloak with the provider hint; sign-up and password reset go through the backend's admin calls.
3. Roles come only from verified token claims; anything the client sends grants nothing.
4. Refusals are generic and recoverable and never reveal whether an account exists or which part was wrong.
5. After any sign-in the learner returns to the page they were on: `returnTo` is accepted only as a same-origin relative path (one
   leading `/`, no scheme, no `//`, not `/sign-in`), kept server-side during social sign-in, else `/`.
6. Signed out, the header offers sign-in through the avatar menu's modal in place; `/sign-in` stays the full page for redirects
   ([app-shell](app-shell.md)).

## Example
A learner on `/essentials/kubernetes` is asked to sign in, enters the password then the mailed code, and lands back on
`/essentials/kubernetes` with a session cookie and no Keycloak page shown.

## Don't / Instead
- Don't redirect the browser to the Keycloak login page; call Keycloak from the backend.
- Don't return Keycloak tokens to JavaScript; keep them with the server session.

## Where
`be/src/modules/domain/identity/`, `be/src/modules/integrations/keycloak/`, `be/src/features/api/identity/`,
`fe/apps/app/src/components/blocks/AuthPanel/`

Related: [premium](premium.md), [verified-experience](verified-experience.md), [app-shell](app-shell.md)
