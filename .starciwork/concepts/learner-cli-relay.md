# learner-cli-relay

Every code task (Bản chất apply, Sự cố, Dự án, the agent steps, the Essentials v2 lab) runs on the learner's machine through the learner CLI, which streams
results to the relay inside the core app. The server never runs the learner's code first; practice and proof are told apart so a CV
line never rests on a self-reported result.

## Terms
- **relay-cli**: the learner CLI, a nest-commander app published as `@starci/next-relay` with bin `starci-relay` (installed with `npm i -g @starci/next-relay`) (owner). *Not to confuse
  with* `be/apps/cli`, the ops CLI (database, imports, dev-grant), which never ships to learners.
- **Relay**: the realtime hub, the push-only device socket (`/socket.io`) and the feed (signed manifests and uploads over `/graphql`),
  all inside core's process (owner).
- **Device**: a learner machine paired to the account with `starci-relay pair <code>`, the six-digit code the web issues on the devices page (one use, ten minutes). It holds a **device key**, an Ed25519 pair made at pairing: the private half stays in the settings folder (this user only, never printed or sent), the public half is registered once.
- **Lab**: the hands-on part of an Essentials v2 lesson. Its content is cut from the seed standard: `bugs/source/` is the lesson branch the learner gets, `source/` is the solution, `hidden/` holds the grader files.
- **Đang luyện**: a relayed or merely HMAC-signed result. **Đã chấm trên máy học viên**: a lab graded on the learner's own machine and signed with the device key; still the practice level. **Đã chứng minh**: a CI run GitHub attests, or a server rerun.

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
7. A learner installs Relay once with `npm i -g @starci/next-relay` and then types `starci-relay` (BE-CLI-6). The package is one bundled file with `--version`, `status` and, because `listen` keeps a connection open, `install-service` / `uninstall-service` (Windows Startup, macOS launchd user agent, Linux systemd user unit, no admin). The app shows the same commands in the devices guide "Cài StarCi Relay" and under "Chi tiết kỹ thuật" of the no-machine notice.
8. Every call of the CLI is a door of the core's schema (`be/contracts/core/schema.graphql`) and takes one `input`: `claimRelayPairCode(input: {code, deviceName, platform})`, `registerRelayDeviceKey(input: {publicKey})`, `relayLabBoot|Tests|Files|Grade(input: …)`. A spec validates the CLI's operations and uploads against that snapshot.
9. The lab actions are `boot`, `chaos`, `test` and `grade`, plus the file watcher a boot starts; each arrives as a signed manifest (task `course:<course>/<lesson>`) and the CLI runs only the commands that manifest names, in its `dir`. `boot` fetches the lesson branch with the device token from `/api/relay/courses/<course>/<lesson>/bugs.tgz`, checks its sha256 and unpacks it into `~/starci/<course>/<lesson>`; a folder that is already there is kept, so the learner's work is never overwritten, and only an empty or missing folder unpacks. It then runs `git init` and commits the tree as "starci: bai <lesson> @ <commit>" (the learner commits on top), composes up, seeds when the manifest names a seed and runs the tests. `watch` uploads the files that change; the relay merges them into the files it holds. `chaos` runs `off` for the switches leaving `chaosOn` and `on` for those entering it, then the tests. The solution, `/solution.tgz`, is refused until a submission passed.
10. `grade` takes the commit from `git rev-parse HEAD` of the learner's folder and refuses while a tracked file has an uncommitted change ("commit trước"). It runs the grading command on a clean detached worktree of that commit with the hidden files written in and `STARCI_SEED_ORDER` set, reads each hidden test by its `[scenario:<id>]` tag, and always deletes the hidden files and the worktree. The result is signed with the device key over the canonical JSON of `{submissionId, nonce, commit, tests: [{id, passed, durationMs, message}]}` and the relay accepts it only for the submission's own nonce, every hidden id once and a signature that verifies. The hidden tests never stay on the machine and their text is never uploaded.

## Example
The learner runs `starci-relay run bf-http-foundation` in a project; the checks run locally and the concepts show "Đang luyện". After
the project's GitHub Action posts a run whose OIDC token GitHub attests, the same concepts show "Đã chứng minh". In a lab the learner commits a fix and submits; the lab shows "Đã chấm trên máy học viên" and stays at "Đang luyện".

## Don't / Instead
- Don't add a learner command to the ops CLI; add it to relay-cli's feature root.
- Don't mark proved from a relayed, HMAC-only or machine-graded result; require the attestation or a server rerun.
- Don't scale core past one replica before a shared hub exists.
- Don't unpack a lab over an existing folder or grade uncommitted work; keep the folder and ask for a commit.

## Where
`be/apps/relay-cli/`, `be/apps/core/`, `be/src/features/client-cli/relay-cli/`, `be/src/features/realtime/`,
`be/src/features/api/relay-feed/`, `be/src/modules/integrations/relay-client/`, `be/src/modules/domain/relay/`,
`be/src/modules/domain/project/`, `fe/apps/app/src/components/blocks/CourseLab/`, `fe/apps/app/src/hooks/courseLab/`,
`fe/packages/starci-next-ui/src/composites/LessonLabPanel/`

Related: [projects](projects.md), [essentials](essentials.md), [verified-experience](verified-experience.md)
