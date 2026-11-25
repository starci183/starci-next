# Refs: name only what the graph has taught

Owner, 2026-11-25. A law for every learner-facing word of StarCi Next content, in any lesson and any generation of it.

## The rule

A learner-facing word names ONLY:

1. the lesson's own concept;
2. that concept's keywords;
3. the transitive `requires` of that concept, with their keywords,

all as `raw/essentials/_graph/concepts.yaml` of the content repository (`starci-next-seed-standard`) holds them. Read the concept's
chain first (`npm run check-graph -- --chain <concept>` prints every bubble that comes before it).

"Learner-facing" is everything a learner can read: page copy, titles, glossary entries, questions and options, hints, MCP answers, a lab's
README, code comments, test names and failure messages, and the same in any framework version of a lab.

No teaser names a later concept either ("bài sau: X", "ta sẽ gặp X ở bài khác"). Why: a word the graph has not taught yet is a gap handed
to the learner, and the course promises that a word is used only after its lesson. A sentence may point to a next step without naming a
concept ("bài tiếp theo"), never to a concept.

A term that is not on the ref tree of the lesson is handled one of two ways: the term is added to the graph first, as a bubble or a
keyword, with the owner's OK, and the lesson's `requires` made to reach it; or it is not used and the idea is said in words the tree
already has. A lesson never carries a term the graph does not give it.

## Enforcer

`npm run check-graph`, rule `ref`, in the content repository (`scripts/validate-ref-rule.mjs`, also run by `npm run validate`). For each
lesson of a course it scans the lesson folder's prose, that is YAML text (author `#` comments excluded), Markdown, and the comments and
string literals of code (never `hidden/` or `.e2e/`), and fails on any term, `vi` name or keyword of a bubble outside the allowed set.

Known gap: the check matches names, so it cannot see a concept described without its name or a one-word keyword used in its everyday sense. Both are held by
review: a reviewer checks every added sentence against the chain.

## Where it applies first

[../essentials/README.md](../essentials/README.md) shows it on Saga: its allowed set and what that rules out.
