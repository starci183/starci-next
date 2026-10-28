import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { interviewPromptText, publicArticleText, section1Text } from "./academy-article.mapper"
import type {
    ChallengePrompt,
    LessonAccess,
    LessonLocale,
    ProgrammingLanguage,
    PublicLesson,
    PublishedLesson,
    PublishedVariant,
    StepPrompt,
} from "./lesson-content.contracts"
import { LESSON_LOCALES, PROGRAMMING_LANGUAGES } from "./lesson-content.contracts"

/** The public interview prompts of one variant: ids and prompts only, never the protected children. */
const stepPromptsOf = (variant: PublishedVariant): Array<StepPrompt> =>
    variant.index.interviewQuestions.map((question) => ({
        stepId: "interview",
        itemId: question.id,
        promptVersion: variant.sha256,
        kind: "interview",
        prompt: interviewPromptText(variant.raw, question),
        requiredFields: ["answer"],
    }))

/** The public challenge prompts of the lesson for one locale and language; grading fields never leave the store. */
const challengePromptsOf = (
    lesson: PublishedLesson,
    locale: LessonLocale,
    programmingLanguage: ProgrammingLanguage,
): Array<ChallengePrompt> =>
    lesson.challenges.map((challenge) => {
        if (!Object.hasOwn(challenge.definitions, locale)) {
            throw new LessonContentError({
                code: LessonContentErrorCode.VariantUnavailable,
                params: { locale, challenge: challenge.id },
            })
        }
        const definition = challenge.definitions[locale]
        return {
            id: challenge.id,
            title: definition.title,
            description: definition.description,
            difficulty: definition.difficulty,
            requirements: definition.requirements[programmingLanguage],
            prerequisites: definition.prerequisites[programmingLanguage],
        }
    })

/**
 * The explicit allowlist projection of one published variant for one locale: the public article text when access is
 * allowed, the exact section-1 range when it is locked, the complete outline either way. No raw source object is
 * spread into the result; every field is picked by name.
 */
export const projectPublicLesson = (
    lesson: PublishedLesson,
    variant: PublishedVariant,
    locale: LessonLocale,
    programmingLanguage: ProgrammingLanguage,
    access: LessonAccess,
): PublicLesson => {
    if (!Object.hasOwn(lesson.metadata, locale)) {
        throw new LessonContentError({ code: LessonContentErrorCode.VariantUnavailable, params: { locale } })
    }
    const metadata = lesson.metadata[locale]
    return {
        id: lesson.contentId,
        version: lesson.version,
        locale,
        programmingLanguage,
        title: metadata.title,
        description: metadata.description,
        minutesRead: metadata.minutesRead,
        isPremium: metadata.isPremium,
        verifiedAt: metadata.verifiedAt,
        availableLocales: LESSON_LOCALES.filter((available) => lesson.metadata[available] !== undefined),
        programmingLanguages: PROGRAMMING_LANGUAGES.filter((language) =>
            Object.keys(lesson.variants).some((key) => key.split(":")[0] === language),
        ),
        access,
        outline: variant.index.outline,
        article:
            access === "allowed"
                ? publicArticleText(variant.raw, variant.index)
                : section1Text(variant.raw, variant.index),
        stepPrompts: stepPromptsOf(variant),
        challengePrompts: challengePromptsOf(lesson, locale, programmingLanguage),
    }
}
