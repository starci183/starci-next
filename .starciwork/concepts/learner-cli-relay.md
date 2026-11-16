# learner-cli-relay

Every code task (Bản chất apply, Sự cố, Dự án, the agent steps) runs on the learner's machine through the learner CLI, which streams
results to the relay inside the core app. The server never runs the learner's code first; practice and proof are told apart so a CV
line never rests on a self-reported result.

## Terms
- **relay-cli**: the learner CLI, a nest-commander app published as `@starci/next` with bin `starci-next` (owner). *Not to confuse
  with* `be/apps/cli`, the ops CLI (database, imports, dev-grant), which never ships to learners.
- **Relay**: the realtime hub, the push-only device socket (`/socket.io`) and the feed (signed manifests and uploads over `/graphql`),
  all inside core's process (owner).
- **Device**: a learner machine paired to the account.
- **Đang luyện**: a relayed or merely HMAC-signed result. **Đã chứng minh**: a CI run GitHub attests, or a server rerun.

## Rules
1. The learner CLI imports no database, entitlement or ops module; it holds only the clock, ids, timer, HTTP port and logger.
2. The relay signs a manifest naming the command and the concepts; the CLI verifies it, runs only that allowlisted command, reads the
   test report's `[concept]` tags and uploads one practice result per concept, queued while offline.
3. Proof needs the GitHub Actions OIDC token of the run to name the bound repository, the commit and the run id; the per-project HMAC
   secret stays only the transport check. Code first, credentials later: the attestation is wired once the owner provides them.
4. Learner-written tests count as evidence; the proved level of an incident needs its mutation score ([essentials](essentials.md)).
5. A lesson scenario run is tagged task `lesson:<lesson id>` with check id = the scenario id (slot `scenario`); a hidden challenge
   scenario has slot `challenge` and ref = the challenge id. The lesson page reads the newest run per check through
   `lessonScenarioRuns` and polls it while a run is in flight.
6. Core runs one replica while the hub is in memory; a device on another replica would miss frames.

## Example
The learner runs `starci-next run bf-http-foundation` in a project; the checks run locally and the concepts show "Đang luyện". After
the project's GitHub Action posts a run whose OIDC token GitHub attests, the same concepts show "Đã chứng minh".

## Don't / Instead
- Don't add a learner command to the ops CLI; add it to relay-cli's feature root.
- Don't mark proved from a relayed or HMAC-only result; require the attestation or a server rerun.
- Don't scale core past one replica before a shared hub exists.

## Where
`be/apps/relay-cli/`, `be/apps/core/`, `be/src/features/client-cli/relay-cli/`, `be/src/features/realtime/`,
`be/src/features/api/relay-feed/`, `be/src/modules/integrations/relay-client/`, `be/src/modules/domain/relay/`,
`be/src/modules/domain/project/`

Related: [projects](projects.md), [essentials](essentials.md), [verified-experience](verified-experience.md)
