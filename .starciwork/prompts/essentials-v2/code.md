# Rules: the lab's TypeScript

Owner, 2026-11-25: TypeScript, commented thoroughly; comments in Vietnamese that explain why, identifiers in English; arrow constants,
never `function` declarations. These rules cover the lab, its infra, its tests and the framework version.

## Style

- Every function is a `const` arrow: `export const reserveStock = async (orderId: string) => {…}`. A helper that is not exported is a
  `const` too. There is no `function` declaration anywhere, in infra and tests included.
- A class appears only where NestJS requires one (module, controller, provider); everything else, including each provider's logic that can
  be a plain function, is an arrow constant. **(đề xuất)**
- Identifiers, file names, log keys and HTTP fields are English. Only comments, and the learner-facing strings of the manifest, are
  Vietnamese.
- Enforcer: none yet, held by review. A lab may turn on the ESLint rule `func-style: ["error", "expression"]`.

## Comments

The lab is read by a learner who is meeting the idea for the first time, so the comments are the lesson's second voice.

- **Explain why, not what.** A comment says why the code is shaped this way and what goes wrong without it; it never restates the line.
  Not `// gọi stock để giữ hàng`, but `// Giữ hàng trước khi trừ tiền cho khỏi phải hoàn tiền khi kho hết; thứ tự này là một quyết định,
không phải ngẫu nhiên.`
- **Thorough.** Every exported const, every step of the flow, every branch that handles a failure and every infra hook has a comment on
  its reason. A file a learner opens has no unexplained block.
- **Natural Vietnamese**, the voice of [../shared/voice.md](../shared/voice.md): short sentences, no word-for-word calques, and no English
  term inside a Vietnamese sentence (owner, 2026-11-26, voice.md §3); identifiers stay as they are, in backticks (`STEPS`, `orders`).
- **Comments obey the REF rule** ([../shared/refs.md](../shared/refs.md)), and at a rung they describe only that rung. The learner file at `c0-naive`
  explains why the naive code is written the way it is without hinting that it will fail or how it would be fixed; a comment that gives
  away a later case's fix is a leak.
- Comments in infra (chaos middleware, the http client) say what fault they inject and why it lives outside the learner file, so a learner
  who opens them understands the lab and is not tempted to edit it.
