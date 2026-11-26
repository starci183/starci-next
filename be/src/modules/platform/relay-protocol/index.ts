/**
 * The relay protocol (platform): the messages the learner's relay and the core's relay door both speak, in one place so the two ends
 * cannot drift. Today it holds the standard reference repositories of the lessons (`lesson-reference.ts`) and the lab case events of a lab@2 lab (`case.result`, `case.hint`, `case.reset`), their schemas, their
 * upload mutations and the mapping between an event and the upload input that carries it.
 */
export {
    CASE_EVENT,
    CASE_EVENT_INPUT_TYPES,
    CASE_EVENT_MUTATIONS,
    CASE_FAILURE,
    CASE_HINT_EVENT,
    CASE_KINDS,
    CASE_MESSAGE_MAX,
    CASE_RESET_EVENT,
    CASE_RESULT_EVENT,
    CASE_STASH_BRANCH_PREFIX,
    CASE_STATUSES,
    CASE_VALUE_MAX,
    caseEventInputOf,
    caseEventOfInput,
    caseTaskIdOf,
} from "./lab-case.schema"
export type {
    CaseEvent,
    CaseEventInput,
    CaseEventMutation,
    CaseEventRead,
    CaseEventType,
    CaseHintEvent,
    CaseKind,
    CaseResetEvent,
    CaseResultEvent,
    CaseStatus,
    WireChaos,
} from "./lab-case.schema"
export {
    LESSON_REFERENCES,
    REFERENCE_ORG,
    isReferencePinned,
    pinnedReferenceOfLesson,
    referenceCommandOf,
    referenceLanguageOf,
    referenceNamed,
    referenceTarballRootOf,
    referenceTarballUrlOf,
    referenceTreeUrlOf,
} from "./lesson-reference"
export type { LessonReference, LessonReferenceLanguage } from "./lesson-reference"
