import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign, type KeyObject } from "node:crypto"
import type { RealtimeTopic } from "@modules/platform/realtime"
import { harnessDetailOf, harnessFactsValid } from "./relay-harness.policy"
import type { ManifestLab } from "./relay-lab.contracts"
import { isLabUploadKind, labIdsOfTask, labUploadValid } from "./relay-lab.policy"
import type {
    ManifestBody,
    ManifestHarness,
    ManifestLesson,
    ManifestLessonScenario,
    ManifestCheck,
    ManifestPlan,
    ProjectRunRequest,
    RelayFrame,
    RelayUpload,
    ScenarioRunRequest,
    SignedManifest,
} from "./relay-feed.contracts"

/** The longest log text an upload carries. */
export const LOG_TEXT_MAX = 16_384
const ID_MAX = 100
const SLOTS: ReadonlySet<string> = new Set([
    "test",
    "e2e",
    "probe",
    "scenario",
    "challenge",
    "bugs",
    "harness-stage",
    "harness-doctor",
    "harness-trial",
])
const LESSON_ID = /^[a-z0-9-]{1,100}$/u
const TIERS: ReadonlySet<string> = new Set(["easy", "medium", "hard", "insane"])
const LIST_MAX = 50
const WHY_MAX = 300
const LEDGER_MAX = 4000
/** The longest measured value a bug-pack result carries (the received line). */
const RECEIVED_MAX = 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu
const SAFE_ID = /^[A-Za-z0-9._:/-]{1,100}$/u

/** The id of the manifest a device is issued for a task at an instant: the same three facts always name the same manifest. */
export const manifestIdOf = (deviceId: string, taskId: string, issuedAt: string): string =>
    createHash("sha256").update(`${deviceId}|${taskId}|${issuedAt}`).digest("hex").slice(0, 32)

/** The checks every project task allows: its own test script, run in the workspace root, ten minutes at most. */
export const PROJECT_CHECKS: ReadonlyArray<ManifestCheck> = [
    { id: "test", command: "npm test", cwd: ".", timeoutMs: 600_000 },
]

/** The JUnit report a project run reads when `starci/project.yaml` names none. */
const DEFAULT_REPORT = "starci/reports/junit.xml"
const COMMAND_MAX = 400
const REPORT_PATH = /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u

/** True when a test command is one printable line of a bounded length. */
const commandValid = (command: string): boolean =>
    command.trim().length > 0 && command.length <= COMMAND_MAX && !/\p{Cc}/u.test(command)

/** True when a report path stays inside the project folder (relative, no `..`). */
const reportValid = (report: string): boolean =>
    report.length <= 200 && REPORT_PATH.test(report) && !report.split("/").includes("..")

/**
 * The checks and plan of a project run, read from the learner's `starci/project.yaml`: its test command (which must write
 * the JUnit XML at the report path) is the one allowlisted check, run in the project folder. Null when the command or the
 * report cannot be one, which the service refuses as an invalid payload.
 */
export const projectRunOf = (
    request: ProjectRunRequest,
): { readonly checks: ReadonlyArray<ManifestCheck>; readonly plan: ManifestPlan } | null => {
    const command = request.testCommand ?? "npm test"
    const report = request.testReport ?? DEFAULT_REPORT
    if (!commandValid(command) || !reportValid(report)) return null
    return {
        checks: [{ id: "test", command, cwd: ".", timeoutMs: 600_000 }],
        plan: { milestone: request.milestone.id, report, concepts: request.milestone.concepts },
    }
}

/** The push topic of one paired device, inside its learner's prefix (BE-REALTIME-3). */
export const relayDeviceTopic = (learnerId: string, deviceId: string): RealtimeTopic<RelayFrame> => ({
    name: `relay:${learnerId}:${deviceId}`,
})

/** One lesson scenario in the canonical key order. */
const scenarioPayloadOf = (scenario: ManifestLessonScenario): Record<string, unknown> => ({
    id: scenario.id,
    title: scenario.title,
    brief: scenario.brief,
    concepts: [...scenario.concepts],
    command: scenario.command,
    cwd: scenario.cwd,
    report: scenario.report,
    timeoutMs: scenario.timeoutMs,
    guards: scenario.guards.map((guard) => ({ name: guard.name, env: guard.env, off: guard.off })),
    ...(scenario.files === undefined
        ? {}
        : { files: scenario.files.map((file) => ({ path: file.path, contentBase64: file.contentBase64 })) }),
})

/** The lesson section in the canonical key order (SCENARIO-CONTRACT v3 §2). */
const lessonPayloadOf = (lesson: ManifestLesson): Record<string, unknown> => ({
    lessonId: lesson.lessonId,
    source: { url: lesson.source.url, sha256: lesson.source.sha256, commit: lesson.source.commit },
    dir: lesson.dir,
    compose: lesson.compose,
    project: lesson.project,
    invariants: { ...lesson.invariants },
    scenarios: lesson.scenarios.map((scenario) => scenarioPayloadOf(scenario)),
    ...(lesson.bugs === undefined
        ? {}
        : {
              bugs: {
                  source: {
                      url: lesson.bugs.source.url,
                      sha256: lesson.bugs.source.sha256,
                      commit: lesson.bugs.source.commit,
                  },
                  tests: lesson.bugs.tests.map((test) => scenarioPayloadOf(test)),
              },
          }),
    ...(lesson.challenge === undefined
        ? {}
        : {
              challenge: {
                  tier: lesson.challenge.tier,
                  scenarios: lesson.challenge.scenarios.map((scenario) => scenarioPayloadOf(scenario)),
              },
          }),
})

/** The harness section in the canonical key order (CONTRACT.md, build manifest). */
const harnessPayloadOf = (harness: ManifestHarness): Record<string, unknown> => {
    const source = { url: harness.source.url, sha256: harness.source.sha256, commit: harness.source.commit }
    if (harness.kind === "doctor") return { kind: harness.kind, tool: harness.tool, source }
    if (harness.kind === "trial") return { kind: harness.kind, trap: harness.trap, source }
    return {
        kind: harness.kind,
        buildId: harness.buildId,
        source,
        dir: harness.dir,
        install: harness.install,
        e2e: harness.e2e,
        report: harness.report,
        keys: harness.keys.map((key) => ({ id: key.id, anyOf: [...key.anyOf] })),
        stages: harness.stages.map((stage) => ({ id: stage.id, e2e: [...stage.e2e] })),
    }
}

/** The lab section in the canonical key order. */
const labPayloadOf = (lab: ManifestLab): Record<string, unknown> => ({
    courseId: lab.courseId,
    lessonId: lab.lessonId,
    repo: { url: lab.repo.url, branch: lab.repo.branch, commit: lab.repo.commit },
    compose: lab.compose,
    project: lab.project,
    services: [...lab.services],
    seed: { command: lab.seed.command, timeoutMs: lab.seed.timeoutMs },
    test: { command: lab.test.command, report: lab.test.report, timeoutMs: lab.test.timeoutMs },
    files: [...lab.files],
    chaos: lab.chaos.map((each) => ({ id: each.id, env: each.env, value: each.value })),
    chaosOn: [...lab.chaosOn],
    action: lab.action,
    ...(lab.grade === undefined
        ? {}
        : {
              grade: {
                  submissionId: lab.grade.submissionId,
                  nonce: lab.grade.nonce,
                  seedOrder: [...lab.grade.seedOrder],
                  commit: lab.grade.commit,
                  files: lab.grade.files.map((file) => ({
                      path: file.path,
                      sha256: file.sha256,
                      content: file.content,
                  })),
              },
          }),
})

/** The canonical JSON of a manifest body: keys in a fixed order, so the CLI verifies the exact signed text. */
export const manifestPayloadOf = (body: ManifestBody): string =>
    JSON.stringify({
        manifestId: body.manifestId,
        taskId: body.taskId,
        learnerId: body.learnerId,
        deviceId: body.deviceId,
        issuedAt: body.issuedAt,
        checks: body.checks.map((check) => ({
            id: check.id,
            command: check.command,
            cwd: check.cwd,
            timeoutMs: check.timeoutMs,
        })),
        ...(body.plan === undefined
            ? {}
            : {
                  plan: { milestone: body.plan.milestone, report: body.plan.report, concepts: [...body.plan.concepts] },
              }),
        ...(body.lesson === undefined ? {} : { lesson: lessonPayloadOf(body.lesson) }),
        ...(body.harness === undefined ? {} : { harness: harnessPayloadOf(body.harness) }),
        ...(body.lab === undefined ? {} : { lab: labPayloadOf(body.lab) }),
    })

/** Signs a manifest body with the relay's Ed25519 key. */
export const signManifest = (body: ManifestBody, key: KeyObject): SignedManifest => {
    const payload = manifestPayloadOf(body)
    return { body, payload, signature: sign(null, Buffer.from(payload, "utf8"), key).toString("base64") }
}

/** The relay's signing key: the sealed PEM when one is configured, else a key made for this process (development only). */
export const signingKeyOf = (pem: string | null): KeyObject =>
    pem === null ? generateKeyPairSync("ed25519").privateKey : createPrivateKey(pem)

/** The SPKI PEM of the public half of a signing key, which the CLI ships to verify manifests. */
export const publicKeyPemOf = (key: KeyObject): string =>
    createPublicKey(key).export({ type: "spki", format: "pem" }).toString()

/** True when an optional text is absent or a short safe id. */
const safeOptional = (value: string | undefined): boolean => value === undefined || SAFE_ID.test(value)

/** True when an optional number is absent or a whole number within bounds. */
const boundedOptional = (value: number | undefined): boolean =>
    value === undefined || (Number.isSafeInteger(value) && value >= -1 && value <= 86_400_000)

/** True when an optional list is absent or a short list of lesson ids. */
const idListOptional = (value: ReadonlyArray<string> | undefined): boolean =>
    value === undefined || (value.length <= LIST_MAX && value.every((item) => LESSON_ID.test(item)))

/** True when the lesson facts of a scenario result are absent or bounded (SCENARIO-CONTRACT v2 §5). */
const lessonFacts = (upload: RelayUpload): boolean =>
    (upload.lessonId === undefined || LESSON_ID.test(upload.lessonId)) &&
    (upload.scenarioId === undefined || LESSON_ID.test(upload.scenarioId)) &&
    idListOptional(upload.concepts) &&
    idListOptional(upload.guardsOff) &&
    (upload.challengeTier === undefined || TIERS.has(upload.challengeTier)) &&
    (upload.why === undefined || upload.why.length <= WHY_MAX) &&
    (upload.ledger === undefined || upload.ledger.length <= LEDGER_MAX) &&
    (upload.received === undefined || upload.received.length <= RECEIVED_MAX)

/** The lesson facts of a scenario result as stored in `detail`, or null for any other result. */
export const resultDetailOf = (upload: RelayUpload): Record<string, unknown> | null => {
    const detail = {
        ...(upload.lessonId === undefined ? {} : { lessonId: upload.lessonId }),
        ...(upload.scenarioId === undefined ? {} : { scenarioId: upload.scenarioId }),
        ...(upload.concepts === undefined ? {} : { concepts: [...upload.concepts] }),
        ...(upload.guardsOff === undefined ? {} : { guardsOff: [...upload.guardsOff] }),
        ...(upload.challengeTier === undefined ? {} : { challengeTier: upload.challengeTier }),
        ...(upload.why === undefined ? {} : { why: upload.why }),
        ...(upload.ledger === undefined ? {} : { ledger: upload.ledger }),
        ...(upload.received === undefined ? {} : { received: upload.received }),
        ...harnessDetailOf(upload),
    }
    return upload.kind === "check.result" && Object.keys(detail).length > 0 ? detail : null
}

/** True when the facts a result needs are present and bounded. */
const resultFacts = (upload: RelayUpload): boolean =>
    lessonFacts(upload) &&
    harnessFactsValid(upload) &&
    upload.checkId !== undefined &&
    upload.passed !== undefined &&
    (upload.slot === undefined || SLOTS.has(upload.slot)) &&
    (upload.ref === undefined || upload.ref.length <= 300) &&
    (upload.commit === undefined || /^[0-9a-f]{7,40}$/u.test(upload.commit))

/** True when an upload is well formed for its kind; anything else is RELAY_PAYLOAD_INVALID. */
export const uploadValid = (upload: RelayUpload): boolean => {
    if (!UUID.test(upload.eventId) || !SAFE_ID.test(upload.taskId) || !SAFE_ID.test(upload.runId)) return false
    if (![upload.checkId, upload.conceptId, upload.manifestId].every((value) => safeOptional(value))) return false
    if (!boundedOptional(upload.exitCode) || !boundedOptional(upload.durationMs)) return false
    // A lab task takes its logs, its acks and the four lab kinds only; a lab kind needs a lab task.
    const isLabTask = labIdsOfTask(upload.taskId) !== null
    if (isLabUploadKind(upload.kind) !== isLabTask && upload.kind !== "log" && upload.kind !== "manifest.ack")
        return false
    switch (upload.kind) {
        case "check.started":
            return upload.checkId !== undefined
        case "check.result":
            return resultFacts(upload)
        case "log":
            return upload.checkId !== undefined && upload.text !== undefined && upload.text.length <= LOG_TEXT_MAX
        case "manifest.ack":
            return upload.manifestId !== undefined && upload.manifestId.length <= ID_MAX
        case "lab.boot":
        case "lab.tests":
        case "lab.files":
        case "lab.grade":
            return labUploadValid(upload)
    }
}

const SCENARIO_ID = /^[a-z0-9][a-z0-9-]{0,63}$/u
const SCENARIO_TIMEOUT_MS = 600_000

/**
 * The one allowlisted check of a scenario run: `starci-relay run <lesson> --scenario <id>` with a `--guard <id>=off` per
 * guard switched off. Null when a lesson, scenario or guard id could not be one (they are slugs, never free text).
 */
export const scenarioCheckOf = (request: ScenarioRunRequest): ManifestCheck | null => {
    const { lessonId, scenarioId, guardsOff } = request
    if (!SAFE_ID.test(lessonId) || !SCENARIO_ID.test(scenarioId)) return null
    if (!guardsOff.every((guard) => SCENARIO_ID.test(guard)) || guardsOff.length > 8) return null
    const guards = guardsOff.map((guard) => ` --guard ${guard}=off`).join("")
    return {
        id: scenarioId,
        command: `starci-relay run ${lessonId} --scenario ${scenarioId}${guards}`,
        cwd: ".",
        timeoutMs: SCENARIO_TIMEOUT_MS,
    }
}
