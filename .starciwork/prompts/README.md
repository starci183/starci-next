# StarCi Next prompts

StarCi Next's own rules for the agents that write its content: how a lesson is titled and how its text reads, and for an Essentials lesson what its six
pages and its lab hold. They are this app's decisions, so they live here and never in the harness.

**Not loaded automatically.** The harness does not load this folder: it has no `prompts` plugin kind, and
`.starcistacks/application-stacks.yaml` declares none. An agent that writes or reviews lesson content reads it only when its brief
points it here, so a brief for that work names this README explicitly.

## Precedence

Harness rules first, then the app's concepts (`.starciwork/concepts/`), then this folder. A rule here narrows style and content; it never
loosens a harness rule. A sentence here that cannot hold beside a concept or a harness rule is put to the owner with both statements.

Every learner-facing word also obeys [shared/refs.md](shared/refs.md) (owner, 2026-11-25): it names only the lesson's concept, its
keywords and its transitive `requires` in the concept graph, never a later concept; the content repository's `check-graph` npm script
(rule `ref`) enforces it for Essentials.

## What to read

Read `shared/` whole, then `essentials/` for an Essentials lesson and its lab.

Essentials has one generation (owner, 2026-11-26: "đưa essential v2 thành v1, xóa v1 đi"): the lab lesson formerly called Essentials v2, six
pages and a lab with a git ladder, Saga the first. The five-part generation (Mở đầu, Bản chất, Tìm sạn, Challenges, Pattern) and its rules were
deleted with its lessons; nothing here describes it, and `shared/` applies to every lesson text.

| Work                                                                                                                | Read                                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| an Essentials lesson and its lab (six pages, lab@2, the REF rule on words, the git ladder, the production repos)     | [essentials/README.md](essentials/README.md), then [lab.md](essentials/lab.md) and [code.md](essentials/code.md); `shared/` first                                                                                                                                                  |
| any lesson text (the copy of a lesson page)                                                                         | [shared/](shared/): [refs.md](shared/refs.md), [title.md](shared/title.md), [vietnamese.md](shared/vietnamese.md), [voice.md](shared/voice.md), [audience.md](shared/audience.md), [diagrams.md](shared/diagrams.md), [numbers.md](shared/numbers.md), [stack.md](shared/stack.md) |

## Marks

A rule marked **(đề xuất)** is a proposal an agent inferred from the owner's rulings and the current lessons; it waits for the owner's
confirmation. Every unmarked rule is the owner's (his words are quoted where they set it). When the owner confirms a proposal, remove its
mark; when he rejects it, delete the rule.
