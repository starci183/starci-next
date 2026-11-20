# locale-routing

How the app serves its two languages and its one probe route, read from the code that owns them (it replaces the former shell record).

## Terms
- **Locale segment**: the `[locale]` route folder of `fe/apps/app/src/app/`; its layout mounts the locale layout (document, language,
  messages) around the client providers, and the pages sit inside.
- **Product i18n**: the one description of the languages in `fe/packages/starci-next-i18n/src/routing.ts`, read by the proxy, the
  navigation and the request config.
- **Probe**: `/health/live`, a route outside the locale segment that answers the liveness status of the process.

## Rules
1. The locales are `vi` and `en`; `vi` is the default and is served at the unprefixed path (prefix only for `en`). Every catalog has the
   same keys in each ([conventions](conventions.md) rule 3).
2. The language changes only through the locale switch, never from `Accept-Language` or a cookie (`localeDetection` is off).
3. The time zone is fixed to `Asia/Ho_Chi_Minh` so the server and the hydrated client format an instant the same way.
4. `/health/live` is excluded from locale negotiation, is never prerendered and answers from process-local state only.
5. A failure that no locale reached is caught by `global-error.tsx`, which renders in the default locale.

## Example
`/essentials` opens in Vietnamese, `/en/essentials` in English; the same request with an English `Accept-Language` still opens in
Vietnamese.

## Don't / Instead
- Don't read the browser language to pick a locale; use the switch ([app-shell](app-shell.md)).
- Don't put a probe under `[locale]`; keep it at `/health/live`.

## Where
`fe/packages/starci-next-i18n/`, `fe/apps/app/src/modules/i18n/`, `fe/apps/app/src/app/`

Related: [conventions](conventions.md), [app-shell](app-shell.md)
