# StarCi Next prompts

StarCi Next's own rules for the agents that write its content: how a lesson is titled, what each of its five parts holds and how the
opener interview reads. They are this app's decisions, so they live here and never in the harness. The harness loads this folder once
`.starcistacks/application-stacks.yaml` declares it in `plugins` (kind `prompts`), after the app's concepts.

## Precedence

Harness rules first, then the app's concepts (`.starciwork/concepts/`), then this plugin. A rule here narrows style and content; it never
loosens a harness rule. A sentence here that cannot hold beside a concept or a harness rule is put to the owner with both statements.

## Files

| File | Read when the work | Holds |
| --- | --- | --- |
| [content.md](content.md) | writes or reviews a lesson's text: its title, its five parts, the opener interview, the copy of a lesson page | the content rules |

## Marks

A rule marked **(đề xuất)** is a proposal an agent inferred from the owner's rulings and the current lessons; it waits for the owner's
confirmation. Every unmarked rule is the owner's (his words are quoted where they set it). When the owner confirms a proposal, remove its
mark; when he rejects it, delete the rule.
