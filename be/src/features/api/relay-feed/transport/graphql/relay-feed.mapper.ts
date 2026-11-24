import type { CredentialPrincipal } from "@modules/domain/identity"
import type { LabBootStage, LabBootStatus, LabGradeFailure, SignedManifest, UploadReceipt } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetRelayManifestRequest } from "../../application/get-relay-manifest.contracts"
import type { UploadRelayEventRequest } from "../../application/upload-relay-event.contracts"
import { HARNESS_DOCTOR_TASK, HARNESS_TRIAL_TASK } from "@modules/domain/relay"
import type {
    RelayLabBootInput,
    RelayLabFilesInput,
    RelayLabGradeInput,
    RelayLabTestsInput,
} from "./dto/relay-lab-event.input"
import type {
    RelayCheckResultInput,
    RelayCheckStartedInput,
    RelayLogInput,
    RelayManifestAckInput,
} from "./dto/relay-event.input"
import type { RelayHarnessResultInput } from "./dto/relay-harness-result.input"
import type { RelayManifestInput } from "./dto/relay-manifest.input"
import type { RelayManifestType } from "./dto/relay-manifest.type"
import type { RelayUploadType } from "./dto/relay-upload.type"

/** Maps the credential and the task to the manifest query params (the device the tool-token credential proved). */
export const toGetRelayManifestParams = (
    credential: CredentialPrincipal,
    input: RelayManifestInput,
): PublicExecuteParams<GetRelayManifestRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        taskId: input.taskId,
        milestone: input.milestone,
        testCommand: input.testCommand,
        testReport: input.testReport,
        scenario: input.scenario,
        challenge: input.challenge,
        bugs: input.bugs,
        tool: input.tool,
    },
})

/** Maps a started check: the device is the one the tool-token credential proved (its learner the workspace, the device the subject). */
export const toCheckStartedParams = (
    credential: CredentialPrincipal,
    input: RelayCheckStartedInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: { kind: "check.started", ...input },
    },
})

/** Maps a check result: the device is the one the tool-token credential proved (its learner the workspace, the device the subject). */
export const toCheckResultParams = (
    credential: CredentialPrincipal,
    input: RelayCheckResultInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: { kind: "check.result", ...input },
    },
})

/**
 * Maps a harness result to a check result of the relay: a trial is task harness:trial with the trap as the check and the tool as
 * the ref (passed when the verdict is held); a doctor probe is task harness:doctor with the probe as the check and the tool as the
 * ref. The event id doubles as the run id; the relay refuses any fact the kind does not carry.
 */
export const toHarnessResultParams = (
    credential: CredentialPrincipal,
    input: RelayHarnessResultInput,
): PublicExecuteParams<UploadRelayEventRequest> => {
    const device = { learnerId: credential.workspaceId, deviceId: credential.subject }
    const base = {
        kind: "check.result" as const,
        eventId: input.eventId,
        runId: input.eventId,
        tool: input.tool,
        ref: input.tool,
    }
    if (input.kind === "harness-trial") {
        return {
            request: {
                device,
                upload: {
                    ...base,
                    taskId: HARNESS_TRIAL_TASK,
                    checkId: input.trap,
                    slot: "harness-trial",
                    passed: input.verdict === "held",
                    verdict: input.verdict,
                    testsGreen: input.testsGreen,
                    shortcuts: input.shortcuts?.map((shortcut) => ({ kind: shortcut.kind, blocked: shortcut.blocked })),
                },
            },
        }
    }
    return {
        request: {
            device,
            upload: {
                ...base,
                taskId: HARNESS_DOCTOR_TASK,
                checkId: input.probe,
                slot: "harness-doctor",
                passed: input.status === "passed",
                status: input.status,
                reason: input.reason,
            },
        },
    }
}

/** Maps a log chunk: the device is the one the tool-token credential proved (its learner the workspace, the device the subject). */
export const toLogParams = (
    credential: CredentialPrincipal,
    input: RelayLogInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: { kind: "log", ...input },
    },
})

/** Maps a manifest ack: the device is the one the tool-token credential proved (its learner the workspace, the device the subject). */
export const toManifestAckParams = (
    credential: CredentialPrincipal,
    input: RelayManifestAckInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: { kind: "manifest.ack", ...input },
    },
})

/** Maps a signed manifest to its GraphQL type. */
export const toRelayManifestType = (signed: SignedManifest): RelayManifestType => ({
    manifestId: signed.body.manifestId,
    taskId: signed.body.taskId,
    checks: signed.body.checks.map((check) => ({ ...check })),
    payload: signed.payload,
    signature: signed.signature,
})

/** Maps an upload receipt to its GraphQL type. */
export const toRelayUploadType = (receipt: UploadReceipt): RelayUploadType => ({
    eventId: receipt.eventId,
    accepted: receipt.accepted,
})

/** Maps a lab boot stage: the device is the one the tool-token credential proved. The event id doubles as the run id. */
export const toLabBootParams = (
    credential: CredentialPrincipal,
    input: RelayLabBootInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: {
            kind: "lab.boot",
            eventId: input.eventId,
            taskId: input.taskId,
            runId: input.runId,
            boot: {
                stage: input.stage as LabBootStage,
                status: input.status as LabBootStatus,
                detail: input.detail,
                durationMs: input.durationMs,
            },
        },
    },
})

/** Maps one run of the visible tests of a lab. */
export const toLabTestsParams = (
    credential: CredentialPrincipal,
    input: RelayLabTestsInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: {
            kind: "lab.tests",
            eventId: input.eventId,
            taskId: input.taskId,
            runId: input.runId,
            labTests: {
                commit: input.commit,
                chaosOn: input.chaosOn,
                tests: input.tests.map((test) => ({
                    id: test.id,
                    name: test.name,
                    passed: test.passed,
                    durationMs: test.durationMs,
                    message: test.message,
                })),
            },
        },
    },
})

/** Maps the mirrored files of a lab. */
export const toLabFilesParams = (
    credential: CredentialPrincipal,
    input: RelayLabFilesInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: {
            kind: "lab.files",
            eventId: input.eventId,
            taskId: input.taskId,
            runId: input.runId,
            labFiles: {
                commit: input.commit,
                files: input.files.map((file) => ({ path: file.path, sha256: file.sha256, text: file.text ?? null })),
            },
        },
    },
})

/** Maps the signed result of a grading run: the tests are exactly the fields the device signed. */
export const toLabGradeParams = (
    credential: CredentialPrincipal,
    input: RelayLabGradeInput,
): PublicExecuteParams<UploadRelayEventRequest> => ({
    request: {
        device: { learnerId: credential.workspaceId, deviceId: credential.subject },
        upload: {
            kind: "lab.grade",
            eventId: input.eventId,
            taskId: input.taskId,
            runId: input.runId,
            grade: {
                submissionId: input.submissionId,
                nonce: input.nonce,
                commit: input.commit,
                tests: input.tests.map((test) => ({
                    id: test.id,
                    passed: test.passed,
                    durationMs: test.durationMs,
                    message: test.message,
                })),
                ...(input.failure === undefined || input.failure === null
                    ? {}
                    : { failure: input.failure as LabGradeFailure }),
                signature: input.signature,
            },
        },
    },
})
