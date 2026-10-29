import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { LessonContentGradingEntity, LessonContentVersionEntity } from "./persistence/entities/lesson-content.entity"
import { toProtectedGrading, toPublishedLesson } from "./persistence/lesson-content.rows"
import type {
    CoachChallengeCriterion,
    CoachChallengeRubric,
    CoachGrading,
    GradingForParams,
    InterviewGrading,
    ProtectedGrading,
    PublishedLesson,
} from "./lesson-content.contracts"
import { challengeKey, variantKey } from "./lesson-content.contracts"

/** Reads the lesson-content grading allowlist for domain consumers such as the lesson coach. */
@Injectable()
/** The protected grading reader: only points and challenge criteria cross this boundary. */
export class LessonContentGradingService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** Returns interviewer points and the selected variant's challenge rubrics without reveal-only material. */
    async gradingFor(params: GradingForParams): Promise<CoachGrading> {
        const lesson = await this.loadPublished(params.contentId, params.version)
        const key = variantKey(params.programmingLanguage, params.locale)
        if (lesson.variants[key] === undefined) {
            throw new LessonContentError({
                code: LessonContentErrorCode.VariantUnavailable,
                params: {
                    contentId: params.contentId,
                    programmingLanguage: params.programmingLanguage,
                    locale: params.locale,
                    available: Object.keys(lesson.variants).join(","),
                },
            })
        }

        const grading = await this.loadGrading(params.contentId, params.version)
        const interviewItems = grading.interviews[key]
        if (interviewItems === undefined) throw this.corruptGrading()
        const challenges = lesson.challenges.map((challenge) => {
            const challengeGrading = grading.challenges[challengeKey(challenge.id, params.locale)]
            if (challengeGrading === undefined) throw this.corruptGrading()
            return {
                challengeId: challenge.id,
                submissionType: challengeGrading.submissionType,
                submissionTitle: challengeGrading.submissionTitle,
                submissionDescription: challengeGrading.submissionDescription,
                submissionScore: challengeGrading.submissionScore,
                outcomeCriteria: challengeGrading.outcomeCriterias.map((criterion) =>
                    this.projectCriterion(criterion, params.programmingLanguage),
                ),
                approachCriteria: challengeGrading.approachCriterias.map((criterion) =>
                    this.projectCriterion(criterion, params.programmingLanguage),
                ),
            } satisfies CoachChallengeRubric
        })

        return {
            contentId: lesson.contentId,
            version: lesson.version,
            locale: params.locale,
            programmingLanguage: params.programmingLanguage,
            interviewPoints: interviewItems.map((item: InterviewGrading) => ({
                itemId: item.itemId,
                interviewerPoints: item.interviewerPoints,
            })),
            challenges,
        }
    }

    private projectCriterion(
        criterion: ProtectedGrading["challenges"][string]["outcomeCriterias"][number],
        programmingLanguage: GradingForParams["programmingLanguage"],
    ): CoachChallengeCriterion {
        return {
            body: criterion.bodies[programmingLanguage],
            score: criterion.score,
            critical: criterion.critical,
        }
    }

    private async loadPublished(contentId: string, version: string): Promise<PublishedLesson> {
        const row = await this.entityManager.findOne(LessonContentVersionEntity, { where: { contentId, version } })
        if (row === null) {
            throw new LessonContentError({
                code: LessonContentErrorCode.NotFound,
                params: { contentId, version },
            })
        }
        return toPublishedLesson(row.payload)
    }

    private async loadGrading(contentId: string, version: string): Promise<ProtectedGrading> {
        const row = await this.entityManager.findOne(LessonContentGradingEntity, { where: { contentId, version } })
        if (row === null) {
            throw new LessonContentError({ code: LessonContentErrorCode.NotFound, params: { contentId, version } })
        }
        return toProtectedGrading(row.payload)
    }

    private corruptGrading(): LessonContentError {
        return new LessonContentError({ code: LessonContentErrorCode.PayloadCorrupt })
    }
}
