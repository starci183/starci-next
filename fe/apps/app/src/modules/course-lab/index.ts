export {
    BOOT_STAGE_IDS,
    UNREAD_LAB_STATE,
    bodyOf,
    defaultDirOf,
    defaultPathOf,
    deviceOf,
    isAllGreen,
    isDirValid,
    isGrading,
    phaseOf,
    placeholderBodyOf,
    stateOf,
} from "./lab"
export type {
    CourseLabCaseResult,
    CourseLabContext,
    CourseLabDevice,
    CourseLabFaulty,
    CourseLabPairing,
    CourseLabPhase,
    CourseLabRead,
    CourseLabStage,
    CourseLabState,
} from "./lab"
export { noticeOf, noticeOfFailure } from "./notice"
export type { CourseLabNotices, CourseLabSubmitWords, CourseLabWords } from "./words"
