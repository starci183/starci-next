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
2. Projects are subscription only (owner 2026-11-17): `PROJECT_FREE_PROJECTS` and `PROJECT_FREE_MILESTONES` default 0, so a free learner sees the pitch and the paywall. A subscriber may own many projects and gets the AI read.
3. A behaviour concept needs a tagged test or e2e flow plus probes; a structure concept needs the AI code read. A project with no HTTP
   surface (CLI, library) is proved by its tests and the AI read, with no probe.
4. The StarCi harness is never forced on a learner's project: no spec records, no architecture lint, no mutation score.
5. Practice comes through the relay and is never proof. Proof is a CI run GitHub attests, the server probe runner (public http or
   https only), or the AI read of the excerpt the learner pastes; the server never clones the repository.
6. A newly proved concept reaches the Bản chất experience line; a proved milestone and a probed deployment reach the career producer;
   each run is one project-run streak action.

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
