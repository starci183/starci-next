import { Injectable } from "@nestjs/common"
import { AttemptReadService } from "@modules/domain/attempt"
import { LessonReadService } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { RecordedExperience } from "./career.contracts"
import { essentialsExperienceOf, type AttachedProject } from "./essentials-evidence.policy"
import { InjectExperienceProducer, type ExperienceProducer } from "./experience-producer.port"

/** A lesson a learner attaches to a project, as the projects shard reports it. */
export interface RecordLessonExperienceParams {
    /** The learner. */
    readonly learnerId: string
    /** The lesson. */
    readonly lessonId: string
    /** The project it is attached to, or null when it is attached to none. */
    readonly project: AttachedProject | null
}

@Injectable()
/**
 * The Essentials producer: it reads the learner's proved outcomes of a lesson from the attempt capability and the lesson in both
 * locales, and hands the experience engine the item only when the lesson is attached to a project, the one way Essentials reaches a
 * CV line. The projects shard calls it when a learner attaches a lesson to a project and when the project's proof changes.
 */
export class EssentialsExperienceService {
    constructor(
        @InjectClock() private readonly clock: Clock,
        @InjectExperienceProducer() private readonly producer: ExperienceProducer,
        private readonly attempts: AttemptReadService,
        private readonly lessons: LessonReadService,
    ) {}

    /** Creates or regrades the item of a lesson attached to a project; answers null, creating nothing, without a project. */
    async record(params: RecordLessonExperienceParams): Promise<RecordedExperience> {
        if (params.project === null) return null
        const lookup = { id: params.lessonId, learnerId: params.learnerId }
        const [lessonVi, lessonEn, progress] = await Promise.all([
            this.lessons.find({ ...lookup, locale: "vi" }),
            this.lessons.find({ ...lookup, locale: "en" }),
            this.attempts.progress({ learnerId: params.learnerId, lessonId: params.lessonId }),
        ])
        const evidence = {
            learnerId: params.learnerId,
            lessonVi,
            lessonEn,
            progress,
            project: params.project,
            at: this.clock.now().toISOString(),
        }
        return this.producer.produce(essentialsExperienceOf(evidence))
    }
}
