/**
 * The career capability: experience items verified by the AI and the teacher (the AI grades, the teacher signs each item).
 *
 * Producer port, for every shard that proves evidence (projects now, incidents later), called after the shard's own write:
 *
 *     ExperienceProducer.produce(params: ProduceExperienceParams) => Promise<ExperienceItemView>
 *
 * A shard takes it with `@InjectExperienceProducer() private readonly experience: ExperienceProducer` (token
 * `EXPERIENCE_PRODUCER`, bound to `ExperienceService.produce`; the app registers `CareerModule.register({ isGlobal: true })`).
 * - `itemType`: a type of the experience catalog (`projects.milestone`, `projects.deployed`, `projects.agent-built`,
 *   `projects.ai-coding-mindset`, `incidents.fixed`, ...); an unknown type, or a project type without `projectId`, is refused
 *   CAREER_ITEM_TYPE_UNKNOWN.
 * - `subject`: what the item is about, unique per learner and type (a project milestone, a project); a second call with the same
 *   subject regrades the open item, and leaves a pending, verified or revoked one as it is (its evidence is frozen).
 * - `evidence`, `slotValues`, `grade`: StarCi evidence only, never a value the learner typed; every slot of the type's template
 *   must be filled in both locales. A passing grade drafts the CV line and puts the item in ai-graded; a failing one keeps it
 *   practising. The state change and its audit row commit together.
 * Essentials produces through `EssentialsExperienceService.record({ learnerId, lessonId, project })`, and only for a lesson
 * attached to a project (null project: no item).
 *
 * `ExperienceService` submits and shows items for their learner, `ExperienceReviewService` approves, returns, revokes,
 * reassigns and escalates for the TEACHER and REVIEWER roles (Keycloak realm roles; a REVIEWER also needs an appointment),
 * `ReviewerService` keeps the appointments, and `ExperienceReadService` serves the lists, the queue, the public verification and
 * `verifiedItems(learnerId)`, the read a path engine counts: only verified items meet a done check. Verified and returned
 * decisions are told to the learner through the notifier port (`experience-notifier.port.ts`, bound by the app with
 * `CareerModule.register({ notifier: NotificationService })`, `SilentNotifierClient` otherwise), after the decision committed.
 */
export { CAREER_ERROR_KINDS } from "./errors/career.error"
export { CAREER_MESSAGES } from "./messages/career.messages"
export { EXPERIENCE_PARTS } from "./experience-catalog.policy"
export { EXPERIENCE_PRODUCER, InjectExperienceProducer } from "./experience-producer.port"
export { EssentialsExperienceService } from "./essentials-experience.service"
export { CareerModule } from "./career.module"
export { ExperienceSeedService } from "./experience-seed.service"
export { parseCareerConfig } from "./career.config"
export { ExperienceReadService } from "./experience-read.service"
export { ExperienceReviewService } from "./experience-review.service"
export { ExperienceService } from "./experience.service"
export { ReviewerService } from "./reviewer.service"
export { careerEntities, careerMigrations } from "./persistence/connection"
export type { ExperienceProducer } from "./experience-producer.port"
export type {
    DecisionResultView,
    ExperienceEvidence,
    ExperienceGrade,
    ExperienceItemView,
    ExperiencePart,
    ExperienceState,
    LocalizedLine,
    MyExperienceView,
    ProduceExperienceParams,
    ReviewDecisionInput,
    ReviewerView,
    ExperienceReviewItemView,
    ReviewQueueTab,
    ReviewQueueView,
    ReviewVerdict,
    Signer,
    SlotValues,
    VerificationView,
} from "./career.contracts"
