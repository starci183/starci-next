# StarCi Next prompts

StarCi Next's own rules for the agents that write its content: how a lesson is titled, what each of its five parts holds and how each
part reads. They are this app's decisions, so they live here and never in the harness.

**Not loaded automatically.** The harness does not load this folder: it has no `prompts` plugin kind, and
`.starcistacks/application-stacks.yaml` declares none. An agent that writes or reviews lesson content reads it only when its brief
points it here, so a brief for that work names this README explicitly.

## Precedence

Harness rules first, then the app's concepts (`.starciwork/concepts/`), then this folder. A rule here narrows style and content; it never
loosens a harness rule. A sentence here that cannot hold beside a concept or a harness rule is put to the owner with both statements.

## What to read

Read `shared/` whole, then only the folder of the part you write. Each part has one job, and another part's rules do not apply to it.

| Work                                                    | Read                                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| any lesson text (every part, the copy of a lesson page) | [shared/](shared/): [title.md](shared/title.md), [vietnamese.md](shared/vietnamese.md), [voice.md](shared/voice.md), [audience.md](shared/audience.md), [diagrams.md](shared/diagrams.md), [numbers.md](shared/numbers.md), [stack.md](shared/stack.md) |
| which part holds what, where a lesson's files live      | [essentials/README.md](essentials/README.md)                                                                                                                                                                                                            |
| part 1, Mở đầu (the opener interview)                   | [essentials/1-mo-dau/prompt.md](essentials/1-mo-dau/prompt.md); it names the rest of its folder                                                                                                                                                         |
| part 2, Bản chất                                        | [essentials/2-ban-chat/rules.md](essentials/2-ban-chat/rules.md), [example.md](essentials/2-ban-chat/example.md)                                                                                                                                        |
| part 3, Tìm sạn                                         | [essentials/3-tim-san/rules.md](essentials/3-tim-san/rules.md)                                                                                                                                                                                          |
| part 4, Challenges                                      | [essentials/4-challenges/rules.md](essentials/4-challenges/rules.md)                                                                                                                                                                                    |
| part 5, Pattern                                         | [essentials/5-pattern/rules.md](essentials/5-pattern/rules.md)                                                                                                                                                                                          |

## Marks

A rule marked **(đề xuất)** is a proposal an agent inferred from the owner's rulings and the current lessons; it waits for the owner's
confirmation. Every unmarked rule is the owner's (his words are quoted where they set it). When the owner confirms a proposal, remove its
mark; when he rejects it, delete the rule.
