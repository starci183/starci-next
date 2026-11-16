import {
    challengeActivityId,
    choiceOptionId,
    openerActivityId,
    type LessonEssential,
    type LessonOpenerQuestion,
} from "./lesson-essential.contracts"
import type { LessonEssentialView, LessonQuestionView } from "./lesson-essential-view.contracts"

/** A question for the learner, field by field: the right index and the explanation are never copied. */
const toQuestionView = (question: LessonOpenerQuestion, activityId: string): LessonQuestionView => ({
    id: question.id,
    activityId,
    prompt: question.prompt,
    choices: question.choices.map((label, index) => ({ id: choiceOptionId(index), label })),
    sectionId: question.sectionId ?? null,
    scenarioId: question.scenarioId ?? null,
})

/**
 * The public projection of the four-part fields: an explicit allowlist like the rest of the lesson view. The opener is free;
 * the source, the code walk, the scenarios and the challenges are emptied while the learner lacks Premium. Null for a lesson
 * written before the four parts.
 */
export const toEssentialView = (
    essential: LessonEssential | undefined,
    isPremium: boolean,
): LessonEssentialView | null => {
    if (essential === undefined) return null
    const opener = essential.opener.map((question) => toQuestionView(question, openerActivityId(question.id)))
    if (!isPremium) {
        return {
            isLocked: true,
            opener,
            source: null,
            invariants: [],
            architecture: null,
            codeWalk: [],
            scenarios: [],
            challenges: [],
        }
    }
    return {
        isLocked: false,
        opener,
        source:
            essential.source === null
                ? null
                : { repo: essential.source.repo, langs: [...essential.source.langs], ref: essential.source.ref ?? null },
        invariants: essential.invariants.map((invariant) => ({ id: invariant.id, text: invariant.text })),
        architecture:
            essential.architecture === null
                ? null
                : {
                      diagram: essential.architecture.diagram,
                      components: essential.architecture.components.map((component) => ({
                          name: component.name,
                          port: component.port ?? null,
                          role: component.role ?? null,
                          invariants: [...component.invariants],
                      })),
                  },
        codeWalk: essential.codeWalk.map((entry) => ({
            id: entry.id,
            title: entry.title,
            invariant: entry.invariant,
            file: entry.file,
            line: entry.line,
            snippet: entry.snippet,
            why: entry.why ?? null,
        })),
        scenarios: essential.scenarios.map((scenario) => ({
            id: scenario.id,
            title: scenario.title,
            fault: scenario.fault,
            command: scenario.command,
            expected: scenario.expected,
            invariant: scenario.invariant,
            guards: [...scenario.guards],
            hint: scenario.hint ?? null,
        })),
        challenges: essential.challenges.map((challenge) => ({
            id: challenge.id,
            level: challenge.level,
            title: challenge.title,
            brief: challenge.brief,
            rubric: challenge.rubric.map((criterion) => ({
                id: criterion.id,
                criterion: criterion.criterion,
                points: criterion.points,
                isCritical: criterion.isCritical === true,
            })),
            hiddenScenarios: challenge.hiddenScenarios ?? 0,
            questions: (challenge.questions ?? []).map((question) =>
                toQuestionView(question, challengeActivityId(challenge.id, question.id)),
            ),
        })),
    }
}
