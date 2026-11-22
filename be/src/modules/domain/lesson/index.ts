/**
 * The Lessons content capability.
 *
 * Features read through `LessonReadService` (the catalog and the public projection) and the cli runs `LessonImportService`.
 * The server-side port for attempts and grading is `LessonContentService`, injected by class:
 * `activity({ lessonId, version, activityId, locale })` answers the whole stored activity (rubric, answers, option
 * correctness) of the version a learner studies, with the phase of its section, and
 * `requireAccess({ learnerId, phase, isPremium })` throws `LESSON_PREMIUM_REQUIRED` for Premium content: content the teacher marked
 * `isPremium: true`, or, when the content carries no mark (the `isPremium` the activity answers), any phase but the free one. The
 * teacher marks a section or a whole lesson with `isPremium: false|true` in its front matter. Nothing it returns may leave the
 * server before a submit.
 */
export { LessonContentService } from "./lesson-content.service"
export { LESSON_ERROR_KINDS, LessonError, LessonErrorCode } from "./errors/lesson.error"
export { LESSON_MESSAGES } from "./messages/lesson.messages"
export { lessonEntities } from "./persistence/entities"
export { LessonImportService } from "./lesson-import.service"
export { LessonSeedSet } from "./lesson-seed.set"
export { LessonTopicSeedSet } from "./lesson-topic-seed.set"
export { LessonLinkService } from "./lesson-link.service"
export { LessonModule } from "./lesson.module"
export { LessonReadService } from "./lesson-read.service"
/**
 * `LessonSourceService`: the one read of a lesson's source tree (`source/` of the lesson folder at the live version's content
 * commit): `tree`, `read`, `search` and `archive` (the tarball). The relay's `source.tgz` door and the MCP share it; the
 * caller checks access with `LessonContentService.requireAccess`.
 */
export { LessonSourceService } from "./lesson-source.service"
export type { LessonSourceMatch, LessonSourcePack, LessonSourceRead } from "./lesson-source.service"
export { lessonSourceTreeOf } from "./lesson-source-tree.policy"
export type {
    LessonSourceTree,
    LessonSourceTreeFile,
    LessonSourceTreeInvariant,
    LessonSourceTreeScenario,
} from "./lesson-source-tree.contracts"
export type {
    LessonActivity,
    LessonContent,
    LessonDifficulty,
    LessonLocale,
    LessonLocaleDocument,
    LessonOptionInsight,
    LessonPhase,
    LessonRootFile,
    LessonSection,
    LessonSimulation,
    LessonWorkspaceFile,
} from "./lesson.contracts"
export { PICKED_FEEDBACK_RELEASE } from "./lesson.contracts"
export type { LessonSourceFile } from "./lesson-import.contracts"
export type {
    LessonArchitectureComponentView,
    LessonArchitectureView,
    LessonBugPackView,
    LessonBugTestView,
    LessonChallengeCriterionView,
    LessonChallengeView,
    LessonChoiceView,
    LessonCodeWalkView,
    LessonEssentialView,
    LessonOpenerStoryView,
    LessonPatternView,
    LessonQuestionView,
    LessonScenarioView,
    LessonSourceView,
} from "./lesson-essential-view.contracts"
export type {
    LessonBugPack,
    LessonBugTest,
    LessonChallenge,
    LessonChallengeLevel,
    LessonEssential,
    LessonHiddenScenario,
    LessonInvariant,
    LessonOpenerEvent,
    LessonOpenerCode,
    LessonOpenerInsight,
    LessonOpenerStory,
    LessonScenario,
    LessonScenarioRun,
    LessonSourceRepo,
} from "./lesson-essential.contracts"
export {
    LESSON_BUG_CHECK_PREFIX,
    LESSON_CHALLENGE_LEVELS,
    LESSON_ESSENCE_SECTION,
    challengeWrittenActivityId,
    lessonBugCheckId,
} from "./lesson-essential.contracts"
export type { LessonRunnable } from "./lesson-content.service"
export type { LessonSourceArchive } from "./lesson-source-archive.policy"
export { sourceArchiveOf } from "./lesson-source-archive.policy"
export type { LessonSourceCode } from "./lesson-source-archive.policy"
export { challengeActivityId, lessonRelayTaskId } from "./lesson-essential.contracts"
export type { LessonTopicCatalog, LessonTopicStep } from "./lesson-topic.contracts"
export type { LessonTopicView } from "./lesson-topic-view.contracts"
export type {
    LessonActivityParams,
    LessonArchiveView,
    LessonCatalogFilter,
    LessonCatalogItemView,
    LessonOpenerAnswersParams,
    LessonOpenerAnswerView,
    LessonOpenerChoiceAnswerView,
    LessonOutline,
    LessonOutlineActivity,
    LessonPlan,
    LessonReadParams,
    LessonView,
} from "./lesson-read.contracts"
export { LESSON_OPENER_SIZE } from "./lesson-essential.policy"
