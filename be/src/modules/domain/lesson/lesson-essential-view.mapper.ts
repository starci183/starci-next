import { lockedEssentialPartsOf, type EssentialPart } from "@modules/domain/entitlement"
import {
    challengeActivityId,
    challengeWrittenActivityId,
    choiceOptionId,
    openerActivityId,
    type LessonEssential,
    type LessonOpenerQuestion,
    type LessonPattern,
} from "./lesson-essential.contracts"
import type { LessonEssentialView, LessonPatternView, LessonQuestionView } from "./lesson-essential-view.contracts"

/** The GitHub address of a Pattern folder (the default branch), or null without a repository. */
const patternUrlOf = (pattern: LessonPattern): string | null => {
    if (pattern.repo === "") return null
    const base = `https://github.com/${pattern.repo}`
    return pattern.path === "" ? base : `${base}/tree/HEAD/${pattern.path}`
}

/** A Pattern stack for the page, field by field. */
const toPatternView = (pattern: LessonPattern): LessonPatternView => ({
    stack: pattern.stack,
    status: pattern.status,
    repo: pattern.repo,
    path: pattern.path,
    url: patternUrlOf(pattern),
    where: pattern.where,
    howFar: pattern.howFar,
    whenDown: pattern.whenDown,
    files: pattern.files.map((file) => ({ path: file.path, note: file.note })),
    snippet:
        pattern.snippet === null
            ? null
            : { lang: pattern.snippet.lang, file: pattern.snippet.file, code: pattern.snippet.code },
})

/** A question for the learner, field by field: the right index, the explanations and the insight are never copied. */
const toQuestionView = (
    question: LessonOpenerQuestion,
    activityId: string,
    writtenActivityId: string | null = null,
): LessonQuestionView => ({
    id: question.id,
    activityId,
    prompt: question.prompt,
    choices: question.choices.map((label, index) => ({ id: choiceOptionId(index), label })),
    sectionId: question.sectionId ?? null,
    sectionRef: question.sectionRef ?? null,
    scenarioId: question.scenarioId ?? null,
    event: question.event === undefined ? null : { at: question.event.at, text: question.event.text },
    title: question.title ?? null,
    symptom: question.symptom ?? null,
    probe: question.probe ?? null,
    contextDiagram: question.contextDiagram ?? null,
    contextCaption: question.contextCaption ?? null,
    steps: [...(question.steps ?? [])],
    technical: question.technical ?? null,
    writtenActivityId,
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
                ? {
                      title: essential.story.title,
                      body: essential.story.body,
                      company: essential.story.company ?? "",
                      facts: [...(essential.story.facts ?? [])],
                      system:
                          essential.story.system === undefined
                              ? null
                              : { diagram: essential.story.system.diagram, caption: essential.story.system.caption },
                      glossary: (essential.story.glossary ?? []).map((entry) => ({
                          term: entry.term,
                          definition: entry.definition,
                      })),
                  }
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
                      toQuestionView(
                          question,
                          challengeActivityId(challenge.id, question.id),
                          question.writtenRequired === true
                              ? challengeWrittenActivityId(challenge.id, question.id)
                              : null,
                      ),
                  ),
                  writtenRequired: challenge.writtenRequired === true,
              }))
            : [],
        // Tìm sạn reads the bug pack: the tests by name and command, never their pass and fail texts or hints.
        bugs:
            has("3-scenarios") && essential.bugs !== undefined && essential.bugs !== null
                ? {
                      tests: essential.bugs.tests.map((test) => ({
                          id: test.id,
                          title: test.title,
                          essence: test.essence,
                          command: test.command,
                          expected: test.expected,
                          received: test.received,
                          hintCount: test.hints.length,
                          isFinal: test.isFinal,
                      })),
                  }
                : null,
        patterns: has("5-patterns") ? (essential.patterns ?? []).map((pattern) => toPatternView(pattern)) : [],
    }
}
