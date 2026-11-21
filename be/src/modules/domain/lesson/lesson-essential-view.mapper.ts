import { lockedEssentialPartsOf, type EssentialPart } from "@modules/domain/entitlement"
import {
    challengeActivityId,
    choiceOptionId,
    openerActivityId,
    type LessonEssential,
    type LessonOpenerQuestion,
} from "./lesson-essential.contracts"
import type { LessonEssentialView, LessonQuestionView } from "./lesson-essential-view.contracts"

/** A question for the learner, field by field: the right index, the explanations and the insight are never copied. */
const toQuestionView = (question: LessonOpenerQuestion, activityId: string): LessonQuestionView => ({
    id: question.id,
    activityId,
    prompt: question.prompt,
    choices: question.choices.map((label, index) => ({ id: choiceOptionId(index), label })),
    sectionId: question.sectionId ?? null,
    sectionRef: question.sectionRef ?? null,
    scenarioId: question.scenarioId ?? null,
    event: question.event === undefined ? null : { at: question.event.at, text: question.event.text },
})

/**
 * The public projection of the four-part fields: an explicit allowlist like the rest of the lesson view. Each part is filled
 * only when the learner may read it (`open`, from the entitlement setting; by default Bản chất, the opener, is the one free
 * part). A part the learner may not read is empty and named in `lockedParts`, so its payload is never sent. Null for a lesson
 * written before the four parts.
 */
export const toEssentialView = (
    essential: LessonEssential | undefined,
    open: ReadonlyArray<EssentialPart>,
): LessonEssentialView | null => {
    if (essential === undefined) return null
    const has = (part: EssentialPart): boolean => open.includes(part)
    const lockedParts = lockedEssentialPartsOf(open)
    const opener = has("1-essential")
        ? essential.opener.map((question) => toQuestionView(question, openerActivityId(question.id)))
        : []
    // The invariants are the rules Source and Kịch bản both name; either part opens them.
    const showRules = has("2-source") || has("3-scenarios")
    return {
        isLocked: lockedParts.length > 0,
        lockedParts,
        story:
            has("1-essential") && essential.story !== undefined && essential.story !== null
                ? { title: essential.story.title, body: essential.story.body }
                : null,
        opener,
        source:
            !has("2-source") || essential.source === null
                ? null
                : { langs: [...essential.source.langs], ref: essential.source.ref ?? null },
        invariants: showRules
            ? essential.invariants.map((invariant) => ({ id: invariant.id, text: invariant.text }))
            : [],
        hiddenInvariants: showRules ? (essential.hiddenInvariants?.length ?? 0) : 0,
        architecture:
            !has("2-source") || essential.architecture === null
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
        codeWalk: has("2-source")
            ? essential.codeWalk.map((entry) => ({
                  id: entry.id,
                  title: entry.title,
                  invariant: entry.invariant,
                  file: entry.file,
                  line: entry.line,
                  snippet: entry.snippet,
                  why: entry.why ?? null,
              }))
            : [],
        scenarios: has("3-scenarios")
            ? essential.scenarios.map((scenario) => ({
                  id: scenario.id,
                  title: scenario.title,
                  fault: scenario.fault,
                  command: scenario.command,
                  expected: scenario.expected,
                  invariant: scenario.invariant,
                  guards: scenario.guards.map((guard) => guard.name),
                  hint: scenario.hint ?? null,
                  isHintLocked: false,
              }))
            : [],
        challenges: has("4-apply")
            ? essential.challenges.map((challenge) => ({
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
                  hiddenScenarios: challenge.hidden?.length ?? challenge.hiddenScenarios ?? 0,
                  questions: (challenge.questions ?? []).map((question) =>
                      toQuestionView(question, challengeActivityId(challenge.id, question.id)),
                  ),
              }))
            : [],
    }
}
