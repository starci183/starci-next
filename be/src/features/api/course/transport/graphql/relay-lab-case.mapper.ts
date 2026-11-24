import type { CredentialPrincipal } from "@modules/domain/identity"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { CaseEventMutation } from "@modules/platform/relay-protocol"
import type { UploadCourseCaseRequest } from "../../application/upload-course-case.contracts"
import type {
    RelayLabCaseHintInput,
    RelayLabCaseResetInput,
    RelayLabCaseResultInput,
} from "./dto/relay-lab-case.input"

/** The device the tool-token credential proved: its learner is the workspace. */
const learnerOf = (credential: CredentialPrincipal): string => credential.workspaceId

const paramsOf = (
    credential: CredentialPrincipal,
    mutation: CaseEventMutation,
    input: Readonly<Record<string, unknown>>,
): PublicExecuteParams<UploadCourseCaseRequest> => ({ request: { learnerId: learnerOf(credential), mutation, input } })

/**
 * The `case.result` upload as the relay protocol writes it: GraphQL's null for an absent optional field becomes an absent field, and
 * the two fields the protocol allows to be null (`learnerCommit`, `failed.invariant`) stay null.
 */
export const toCaseResultParams = (
    credential: CredentialPrincipal,
    input: RelayLabCaseResultInput,
): PublicExecuteParams<UploadCourseCaseRequest> =>
    paramsOf(credential, "relayLabCaseResult", {
        eventId: input.eventId,
        taskId: input.taskId,
        lessonId: input.lessonId,
        caseId: input.caseId,
        kind: input.kind,
        status: input.status,
        ranAt: input.ranAt,
        durationMs: input.durationMs,
        learnerCommit: input.learnerCommit ?? null,
        chaos: input.chaos.map((each) => ({ key: each.key, value: each.value })),
        upTo: input.upTo.map((each) => ({ caseId: each.caseId, status: each.status })),
        ...(input.failed === null || input.failed === undefined
            ? {}
            : {
                  failed: {
                      invariant: input.failed.invariant ?? null,
                      message: input.failed.message,
                      ...(input.failed.expected == null ? {} : { expected: input.failed.expected }),
                      ...(input.failed.actual == null ? {} : { actual: input.failed.actual }),
                  },
              }),
    })

/** The `case.hint` upload as the relay protocol writes it. */
export const toCaseHintParams = (
    credential: CredentialPrincipal,
    input: RelayLabCaseHintInput,
): PublicExecuteParams<UploadCourseCaseRequest> =>
    paramsOf(credential, "relayLabCaseHint", {
        eventId: input.eventId,
        taskId: input.taskId,
        lessonId: input.lessonId,
        caseId: input.caseId,
        level: input.level,
        at: input.at,
    })

/** The `case.reset` upload as the relay protocol writes it. */
export const toCaseResetParams = (
    credential: CredentialPrincipal,
    input: RelayLabCaseResetInput,
): PublicExecuteParams<UploadCourseCaseRequest> =>
    paramsOf(credential, "relayLabCaseReset", {
        eventId: input.eventId,
        taskId: input.taskId,
        lessonId: input.lessonId,
        caseId: input.caseId,
        stashedBranch: input.stashedBranch,
        at: input.at,
    })
