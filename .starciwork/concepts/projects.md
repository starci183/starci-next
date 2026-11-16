# projects

Dự án: the learner brings their own projects, on any topic, language and structure, and puts the `starci/` folder into each. A
milestone is a list of Bản chất concepts; it passes when each concept has evidence. There is no sample project (owner).

## Terms
- **Project**: the learner's own repository, kind `app` or `agent` (an agent project is the proof of the agent lab).
- **Milestone**: a list of Bản chất concepts from the content repo's project catalog.
- **Evidence slot**: a tagged test, an e2e flow, a StarCi probe of the deployed address, or the AI code read.
- **Đang luyện** (practising) versus **Đã chứng minh** (proved); see [learner-cli-relay](learner-cli-relay.md).

## Rules
1. There is no StarCi Shop sample, no sample steps, hints or solution, and no template a project starts from.
2. Projects are subscription-only. `PROJECT_FREE_PROJECTS` and `PROJECT_FREE_MILESTONES` are settings that default to 0 and none; they
   only tell the screen what a free learner may see. The back end refuses every project create, concept pointer change, relay upload or
   manifest, probe run, CI delivery and AI read from a learner without Premium with `PROJECT_PREMIUM_REQUIRED` (`RELAY_PROJECT_PREMIUM_REQUIRED`
   at the relay), read through the one entitlement question; no screen state is relied on. A project made before this rule keeps its
   read-only history (list, milestone, concept, runs) and accepts no new run until the learner subscribes. Why: a free account must never
   cost a probe call, an AI call or a CV line.
3. What a concept needs is data in the catalog (`requires`: every group is needed, one slot of a group is enough, and a red slot of a
   group is never hidden by a green sibling). A behaviour concept with an HTTP surface needs a test or an e2e flow, and a server probe;
   a behaviour concept with no HTTP surface needs an e2e flow and the AI code read; a structure concept needs a test and the AI code read.
   A slot is proved only by its own source: a test or e2e flow by a CI run GitHub attests, a probe by the server runner, a code read by
   the AI teacher; the same results from the learner machine or unattested CI are `Đang luyện`. Green tests with a red probe are never proved.
4. The StarCi harness is never forced on a learner's project: no spec records, no architecture lint, no mutation score.
5. Practice comes through the relay and is never proof. Proof is a CI run GitHub attests, the server probe runner (public http or
   https only), or the AI read of the excerpt the learner pastes; the server never clones the repository.
6. A newly proved concept reaches the Bản chất experience line; a proved milestone and a probed deployment reach the career producer;
   each run is one project-run streak action. A proof is claimed once and is not taken back when a later probe turns red.
7. The AI code read grades the pasted excerpt and a two-to-three sentence explanation against the rubric of the concept's lesson with the
   one teacher model; the criterion levels with their quoted evidence and the question are stored with the result, the excerpt is not.

## Example
A learner makes "my-blog-api" and "shop-bot", copies `starci/` into both, runs `starci-next run` and sees "3/8 concept đã chứng minh"
on each after their GitHub Action runs; neither started from a template.

## Don't / Instead
- Don't seed or offer a sample project; show the empty list with "Tạo dự án".
- Don't count a relayed run as proof; wait for the attested CI run, the probe or the AI read.

## Where
`be/src/modules/domain/project/`, `be/src/features/api/project/`, `fe/apps/app/src/app/[locale]/(app)/projects/`,
`fe/apps/app/src/components/blocks/ProjectsList/`

Related: [learner-cli-relay](learner-cli-relay.md), [essentials](essentials.md), [verified-experience](verified-experience.md),
[learning-program](learning-program.md), [content](content.md)
