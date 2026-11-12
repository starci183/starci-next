import type { CredentialPrincipal } from "@modules/domain/identity"
import type { SignedManifest, UploadReceipt } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetRelayManifestRequest } from "../../application/get-relay-manifest.contracts"
import type { UploadRelayEventRequest } from "../../application/upload-relay-event.contracts"
import type {
    RelayCheckResultInput,
    RelayCheckStartedInput,
    RelayLogInput,
    RelayManifestAckInput,
} from "./dto/relay-event.input"
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
