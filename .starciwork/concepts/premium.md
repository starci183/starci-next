# premium

One Premium subscription, monthly or yearly, unlocks every part and the AI. Nothing is sold per course and nothing is an enrollment
(owner: the content is one part of the teacher's harness, not products sold one by one).

## Terms
- **Premium**: an entitlement (`isPremium`, `premiumUntil`) owned by the entitlement capability. *Not to confuse with* a Keycloak role:
  PREMIUM is never a role.
- **Offer**: monthly 229.000 ₫ or yearly 2.290.000 ₫ (ten months), defined once on the server.
- **Free tier**: what a learner without Premium may use, set per part below and by the teacher's `isPremium` marks in the content.
- **Rail**: a payment provider, SePay or payOS.

## Rules
1. Premium is the single gate for content and the AI; every capability asks the entitlement question, none keeps its own.
2. The free tier: every lesson overview and its challenge phase (or exactly what the teacher's `isPremium` marks free; a section mark
   wins over the lesson mark, and `isPremium: true` locks even the challenge); review cards marked `isPremium: false`; one 3-question
   interview a month from free questions; the first problem of each practice pattern; one summary CV review. Projects are subscription only: no free
   project and no free milestone, and a reader without Premium sees the pitch and the subscribe action, never a reduced tool. Everything else, the AI, the public profile and the hiring bridge need Premium.
3. A refused learner causes no AI provider call.
4. The price lives only in the server's offer; the client sends a plan, never an amount. Prices display with Vietnamese thousands
   separators (229.000 ₫, 2.290.000 ₫).
5. Premium is granted only by an authenticated provider IPN or webhook whose reference, status, amount and currency match the pending
   purchase, exactly once; a browser return or cancel redirect proves nothing. A paid confirmation arriving after the order was
   cancelled or expired still grants once and leaves an audit event.
6. A renewal of active Premium extends from the current `premiumUntil`; an expired one starts at the confirmation time. Terms add in
   UTC calendar months or years, clamped to the last day of the target month. There is no grace period and no automatic recurring
   billing.
7. A verified SePay void of a paid order removes exactly the time that order added (later extensions shift back), in one transaction,
   recorded and told to the learner; a repeated void changes nothing. payOS sends no refund event, so only SePay revokes.
8. The checkout rail defaults to the learner's last-used rail, else SePay.
9. A real charge is never made without the owner's explicit approval; proofs run on sandbox rails.
10. Premium for testing comes only from the dev command `cli entitlement dev-grant`, enabled by `ENTITLEMENT_DEV_GRANT=true` on the
    development ops cli alone, refused `ENTITLEMENT_DEV_GRANT_DISABLED` elsewhere. No door, webhook or screen grants Premium without a
    purchase.

## Example
A free learner studies a lesson's challenge phase; the other phases show a lock and "Xem Premium". They pay 229.000 ₫ by SePay; the
IPN arrives twice; Premium is granted once for one month and the same lesson and the AI coach open with no extra step.

## Don't / Instead
- Don't sell a course, lesson or topic, show a cart or create an enrollment; unlock everything with Premium.
- Don't show credits, tokens or "N answers left" for the AI; cap fair use on the server ([ai-teacher](ai-teacher.md)).
- Don't grant on a return URL; wait for the verified provider event.

## Where
`be/src/modules/domain/purchase/`, `be/src/modules/domain/entitlement/`, `be/src/modules/integrations/sepay/`,
`be/src/modules/integrations/payos/`, `be/src/features/api/commerce/`, `be/src/features/cli/entitlement/`,
`fe/apps/app/src/app/[locale]/(app)/premium/`

Related: [ai-teacher](ai-teacher.md), [app-shell](app-shell.md), [content](content.md), [conventions](conventions.md)
