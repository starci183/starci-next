import {
    CHALLENGE_LEVELS,
    ESSENTIAL_PARTS,
    LESSON_PART_COUNT,
    LESSON_PHASES,
    type ChallengeLevel,
    type ChallengeScoreView,
    type EssentialPart,
    type EssentialView,
    type OpenerScoreView,
    type ScenarioRunView,
    type ActivityView,
    type AttemptView,
    type CatalogLessonView,
    type ExerciseFileView,
    type LessonDifficulty,
    type LessonPartsView,
    type LessonView,
    type ProgressView,
    type SectionView,
    type TopicView,
    type WorkspaceVariantView,
} from "@/modules/types"
import type {
    LessonOpenerScoresQuery,
    LessonPartsProgressQuery,
    LessonProgressQuery,
    LessonQuery,
    LessonChallengeScoresQuery,
    LessonScenarioRunsQuery,
    LessonsQuery,
    LessonTopicQuery,
    SubmitLessonAttemptMutation,
} from "@/modules/api"

/** The lesson of the answer as the study screen reads it. */
type LessonWire = LessonQuery["lesson"]

/** The page part of each part id the back end names (the folders of the lesson's four parts). */
const PART_OF_WIRE: Readonly<Record<string, EssentialPart | undefined>> = {
    "1-essential": "essence",
    "2-source": "source",
    "3-scenarios": "scenarios",
    "4-apply": "apply",
}

/** The difficulty the back end names; anything else is a contract break and stops here. */
const difficultyOf = (raw: string): LessonDifficulty => {
    if (raw === "foundation" || raw === "intermediate" || raw === "advanced") return raw
    throw new Error(`unknown difficulty ${raw}`)
}

/** The phase of a section; the overview and the review are not sections. */
const sectionPhaseOf = (raw: string): SectionView["phase"] => {
    const phase = LESSON_PHASES.find((each) => each === raw && each !== "overview" && each !== "review")
    if (phase === undefined) throw new Error(`unknown phase ${raw}`)
    return phase
}

/** The kind of an activity; anything else is a contract break and stops here. */
const kindOf = (raw: string): ActivityView["kind"] => {
    if (raw === "explain" || raw === "choice" || raw === "simulation" || raw === "exercise" || raw === "retrieval")
        return raw
    throw new Error(`unknown activity kind ${raw}`)
}

/** The activity of the answer as the learner sees it before a submit. */
const activityOf = (wire: LessonWire["sections"][number]["activities"][number]): ActivityView => ({
    id: wire.id,
    kind: kindOf(wire.kind),
    prompt: wire.prompt,
    isDiagnostic: wire.isDiagnostic,
    criteria: wire.criteria.map((criterion) => criterion.criterion),
    options: wire.options,
    simulation:
        wire.simulation === null
            ? undefined
            : {
                  initialStateId: wire.simulation.initialStateId,
                  debriefQuestion: wire.simulation.debriefQuestion,
                  states: wire.simulation.states,
                  actions: wire.simulation.actions,
                  edges: wire.simulation.transitions,
              },
    instructions: wire.exercise?.submissionInstructions ?? "",
    files: (wire.exercise?.files ?? []).map((file) => ({
        path: file.relativePath,
        language: file.syntaxLanguage,
        content: file.content,
    })),
})

/** A section of the answer with its body read into blocks; a locked section carries no body and no activity. */
const sectionOf = (wire: LessonWire["sections"][number]): SectionView => ({
    id: wire.id,
    phase: sectionPhaseOf(wire.phase),
    title: wire.title,
    isLocked: wire.locked,
    markdown: wire.body ?? "",
    activities: wire.activities.map((activity) => activityOf(activity)),
})

/** True for a reference the import keeps for its own record (the legacy source a lesson was migrated from): the learner is not shown it. */
const isInternalReference = (citation: string): boolean => citation.startsWith("legacy;")

/** The code language of a workspace file, by its extension; empty for a file the code view cannot colour. */
const codeLanguageOf = (path: string): string => {
    if (path.endsWith(".ts")) return "typescript"
    if (path.endsWith(".java")) return "java"
    if (path.endsWith(".cs")) return "csharp"
    if (path.endsWith(".go")) return "go"
    if (path.endsWith(".csproj")) return "xml"
    return ""
}

/** The names the language switch shows, by language id. */
const WORKSPACE_LANGUAGE_LABELS: Readonly<Record<string, string>> = {
    typescript: "TypeScript",
    java: "Java",
    csharp: "C#",
    go: "Go",
}

/** The order of the switch; typescript leads and is the default. */
const WORKSPACE_LANGUAGE_ORDER: ReadonlyArray<string> = ["typescript", "java", "csharp", "go"]

/** The lab per language, in the switch's order; fewer than two languages need no switch and answer nothing. */
const workspacesOf = (wire: LessonWire["workspaces"]): LessonView["workspaces"] =>
    wire.length < 2
        ? []
        : wire
              .toSorted(
                  (a, b) => WORKSPACE_LANGUAGE_ORDER.indexOf(a.language) - WORKSPACE_LANGUAGE_ORDER.indexOf(b.language),
              )
              .map((variant) => ({
                  id: variant.language,
                  label: WORKSPACE_LANGUAGE_LABELS[variant.language] ?? variant.language,
                  files: variant.files.map((file) => ({
                      path: file.path,
                      language: codeLanguageOf(file.path),
                      content: file.content,
                  })),
              }))

/** The lesson of the answer, in the shape the study block draws. */
export const lessonOf = (wire: LessonWire): LessonView => ({
    id: wire.id,
    title: wire.title,
    description: wire.description,
    category: wire.category,
    group: wire.group,
    topic: wire.topic,
    difficulty: difficultyOf(wire.difficulty),
    minutes: wire.minutes,
    implementation: wire.implementation,
    overviewMarkdown: wire.overview,
    outcomes: wire.learningOutcomes,
    prerequisites: wire.prerequisites,
    references: wire.references
        .filter((reference) => !isInternalReference(reference.citation))
        .map((reference) => ({
            id: reference.id,
            label: reference.label,
            href: reference.url ?? "",
        })),
    isPremium: wire.isPremium,
    version: wire.version,
    sections: wire.sections.toSorted((a, b) => a.sortIndex - b.sortIndex).map((section) => sectionOf(section)),
    files: (wire.workspace?.files ?? []).map((file) => ({
        path: file.path,
        language: codeLanguageOf(file.path),
        content: file.content,
    })),
    workspaces: workspacesOf(wire.workspaces),
    essential: wire.essential === null ? undefined : essentialOf(wire.essential),
})

/** The four parts of the answer; the back end already left out the right answers and the hidden scenarios. */
const essentialOf = (wire: NonNullable<LessonWire["essential"]>): EssentialView => ({
    isLocked: wire.isLocked,
    lockedParts: wire.lockedParts.flatMap((id) => {
        const part = PART_OF_WIRE[id]
        return part === undefined ? [] : [part]
    }),
    story: wire.story === null ? undefined : { title: wire.story.title, body: wire.story.body },
    opener: wire.opener.map((question) => questionOf(question)),
    source: wire.source === null ? undefined : { langs: wire.source.langs },
    invariants: wire.invariants,
    architecture:
        wire.architecture === null
            ? undefined
            : {
                  diagram: wire.architecture.diagram,
                  components: wire.architecture.components.map((component) => ({
                      name: component.name,
                      port: component.port ?? "",
                      role: component.role ?? "",
                      invariants: component.invariants,
                  })),
              },
    codeWalk: wire.codeWalk.map((entry) => ({ ...entry, why: entry.why ?? "" })),
    scenarios: wire.scenarios.map((scenario) => ({
        id: scenario.id,
        title: scenario.title,
        fault: scenario.fault,
        expected: scenario.expected,
        invariant: scenario.invariant,
        guards: scenario.guards,
        hint: scenario.hint ?? "",
        isHintLocked: scenario.isHintLocked,
    })),
    challenges: wire.challenges.flatMap((challenge) => {
        const level = CHALLENGE_LEVELS.find((each) => each === challenge.level)
        return level === undefined
            ? []
            : [
                  {
                      id: challenge.id,
                      level,
                      title: challenge.title,
                      brief: challenge.brief,
                      rubric: challenge.rubric,
                      hiddenScenarios: challenge.hiddenScenarios,
                      questions: challenge.questions.map((question) => questionOf(question)),
                  },
              ]
    }),
})

/** A question as the answer carries it: an opener question also has its story event, a challenge question none. */
type QuestionWire = Omit<NonNullable<LessonWire["essential"]>["opener"][number], "event"> & {
    readonly event?: NonNullable<LessonWire["essential"]>["opener"][number]["event"]
}

/** A question of the answer: its choices, its links as empty texts when it has none, and its story event. */
const questionOf = (wire: QuestionWire): EssentialView["opener"][number] => ({
    id: wire.id,
    activityId: wire.activityId,
    prompt: wire.prompt,
    choices: wire.choices,
    sectionId: wire.sectionId ?? "",
    sectionRef: wire.sectionRef ?? "",
    scenarioId: wire.scenarioId ?? "",
    event: wire.event === null || wire.event === undefined ? undefined : { at: wire.event.at, text: wire.event.text },
})

/** The opener scores of the answer, by lesson id. */
export const openerScoresOf = (wire: LessonOpenerScoresQuery): Readonly<Record<string, OpenerScoreView>> =>
    Object.fromEntries(wire.lessonOpenerScores.map((score) => [score.lessonId, score]))

/** The status of a run the back end names; anything else is a contract break and stops here. */
const runStatusOf = (raw: string): ScenarioRunView["status"] => {
    if (raw === "running" || raw === "passed" || raw === "failed") return raw
    throw new Error(`unknown run status ${raw}`)
}

/** The newest run of each scenario of the answer. */
export const scenarioRunsOf = (wire: LessonScenarioRunsQuery): ReadonlyArray<ScenarioRunView> =>
    wire.lessonScenarioRuns.map((run) => ({
        scenarioId: run.scenarioId,
        status: runStatusOf(run.status),
        output: run.output ?? "",
        why: run.why ?? "",
        ledger: run.ledger ?? "",
        guardsOff: run.guardsOff,
        challengeTier: run.challengeTier ?? "",
        at: run.at,
    }))

/** The lessons of the catalog answer, in the shape the catalog filters. */
export const catalogLessonsOf = (wire: LessonsQuery): ReadonlyArray<CatalogLessonView> =>
    wire.lessons.map((item) => ({ ...item, difficulty: difficultyOf(item.difficulty) }))

/** The topic of the answer: its path in the teacher's order, a lesson not moved yet carrying no id. */
export const topicOf = (wire: LessonTopicQuery): TopicView => ({
    id: wire.lessonTopic.id,
    title: wire.lessonTopic.title,
    group: wire.lessonTopic.group,
    source: wire.lessonTopic.from,
    description: wire.lessonTopic.description ?? "",
    prerequisites: wire.lessonTopic.prerequisites ?? [],
    related: (wire.lessonTopic.related ?? []).map((topic) => ({
        id: topic.id,
        title: topic.title,
        listed: topic.listed,
    })),
    path: wire.lessonTopic.path
        .toSorted((a, b) => a.order - b.order)
        .map((row) => ({ order: row.order, title: row.title, lessonId: row.lessonId ?? "" })),
})

/** The attempt as the server answered it, the same shape from the mutation and from the attempt query. */
type AttemptWire = SubmitLessonAttemptMutation["submitLessonAttempt"]

/** The status of an attempt; anything else is a contract break and stops here. */
const statusOf = (raw: string): AttemptView["status"] => {
    if (raw === "saved" || raw === "grading" || raw === "graded" || raw === "failed") return raw
    throw new Error(`unknown attempt status ${raw}`)
}

/** The attempt of the answer, with its result when it carries one. */
export const attemptOf = (wire: AttemptWire): AttemptView => ({
    attemptId: wire.attemptId,
    activityId: wire.activityId,
    revision: wire.revision,
    status: statusOf(wire.status),
    failureCode: wire.failureCode ?? "",
    savedAt: wire.gradedAt ?? wire.submittedAt,
    answer: {
        optionId: wire.answer.optionId ?? "",
        text: wire.answer.text ?? "",
        actionIds: wire.answer.actionIds ?? [],
        reachedStateId: wire.answer.reachedStateId ?? "",
        debrief: wire.answer.debrief ?? "",
    },
    result:
        wire.result === null
            ? undefined
            : {
                  correct: wire.result.correct ?? undefined,
                  success: wire.result.success ?? undefined,
                  reachedStateId: wire.result.reachedStateId ?? "",
                  score: wire.result.score,
                  maxScore: wire.result.maxScore,
                  isDiagnostic: wire.result.isDiagnostic,
                  options: wire.result.options,
                  insight:
                      wire.result.insight === null || wire.result.insight === undefined
                          ? undefined
                          : {
                                essence: wire.result.insight.essence,
                                why: wire.result.insight.why,
                                interview: wire.result.insight.interview,
                            },
                  criteria: wire.result.criteria.map((criterion) => ({
                      id: criterion.criterionId,
                      criterion: criterion.criterion,
                      level: criterion.level,
                      evidence: criterion.evidenceQuote,
                      missing: criterion.missing,
                      maxScore: criterion.maxScore,
                  })),
              },
})

/** The outcome states the back end names; anything else is a contract break and stops here. */
const outcomeStateOf = (raw: string): ProgressView["outcomes"][number]["state"] => {
    if (raw === "not-started" || raw === "learning" || raw === "mastered" || raw === "needs-review") return raw
    throw new Error(`unknown outcome state ${raw}`)
}

/** The state of a phase the back end names; anything else is a contract break and stops here. */
const phaseStateOf = (raw: string): ProgressView["phases"][number]["state"] => {
    if (raw === "open" || raw === "done") return raw
    throw new Error(`unknown phase state ${raw}`)
}

/** The learner progress of the answer: the outcomes with the state the server decides, the six phases, the latest attempt of each activity, the walks and the reviews. */
export const lessonProgressOf = (wire: LessonProgressQuery): ProgressView => ({
    phase: wire.lessonProgress.phase,
    outcomes: wire.lessonProgress.outcomes.map((outcome) => ({ ...outcome, state: outcomeStateOf(outcome.state) })),
    total: wire.lessonProgress.attempts.total,
    completedAt: wire.lessonProgress.completedAt ?? "",
    readSectionIds: wire.lessonProgress.readSectionIds,
    phases: wire.lessonProgress.phases.map((each) => ({ ...each, state: phaseStateOf(each.state) })),
    activities: wire.lessonProgress.activities.map((activity) => ({
        activityId: activity.activityId,
        phase: activity.phase,
        latestAttemptId: activity.latestAttemptId,
        latestStatus: activity.latestStatus,
        latest: attemptOf(activity.latest),
    })),
    simulations: wire.lessonProgress.simulations,
    reviews: wire.lessonProgress.reviews,
})

/** The languages whose lab the back end serves as a zip. */
const DOWNLOAD_LANGUAGES: ReadonlySet<string> = new Set(["typescript", "java", "csharp", "go"])

/** The name of a language as the switch shows it. */
export const workspaceLanguageLabelOf = (language: string): string => WORKSPACE_LANGUAGE_LABELS[language] ?? language

/** The door that serves the lab of a lesson in one language as a zip (Premium only); undefined for a language it does not serve. */
export const workspaceDownloadOf = (lessonId: string, language: string): string | undefined =>
    DOWNLOAD_LANGUAGES.has(language)
        ? `/api/lessons/${encodeURIComponent(lessonId)}/workspace/${language}/download`
        : undefined

/** The language folder a lab path sits in (`workspace/1-java/Source.java` or `1-java/Source.java`), or undefined for a path outside one. */
const languageFolderOf = (path: string): string | undefined => /^(?:workspace\/)?\d+-([a-z]+)\//u.exec(path)?.[1]

/** The path without its `<n>-<language>/` folder. */
const withoutLanguageFolder = (path: string): string => path.replace(/^(?:workspace\/)?\d+-[a-z]+\//u, "")

/**
 * The files of a lab grouped by the language folder they sit in, in the switch's order, with the folder left off the shown path.
 * Files that sit in no language folder, or fewer than two languages, answer nothing: one lab needs no switch.
 */
export const variantsOfFiles = (files: ReadonlyArray<ExerciseFileView>): ReadonlyArray<WorkspaceVariantView> => {
    const ids = [...new Set(files.flatMap((file) => languageFolderOf(file.path) ?? []))].toSorted(
        (a, b) => WORKSPACE_LANGUAGE_ORDER.indexOf(a) - WORKSPACE_LANGUAGE_ORDER.indexOf(b),
    )
    if (ids.length < 2) return []
    return ids.map((id) => ({
        id,
        label: WORKSPACE_LANGUAGE_LABELS[id] ?? id,
        files: files
            .filter((file) => languageFolderOf(file.path) === id)
            .map((file) => ({ ...file, path: withoutLanguageFolder(file.path) })),
    }))
}

/** One fenced code block of a markdown source, as the line numbers it spans. */
type FenceSpan = { readonly start: number; readonly end: number }

/** The fenced code blocks of a markdown source, found line by line: a fence opens with three or more backticks or tildes and closes with the same mark. */
const fencesOf = (lines: ReadonlyArray<string>): ReadonlyArray<FenceSpan> => {
    const spans: Array<FenceSpan> = []
    let open: { readonly mark: string; readonly start: number } | undefined
    lines.forEach((line, index) => {
        const mark = line.trimStart().slice(0, 3)
        const isMark = mark === "```" || mark === "~~~"
        if (open === undefined && isMark) open = { mark, start: index }
        else if (open !== undefined && isMark && mark === open.mark) {
            spans.push({ start: open.start, end: index })
            open = undefined
        }
    })
    return spans
}

/** True for a line that is only a bold label (`**Windows**`), the line that names the command block after it. */
const isLabelLine = (line: string): boolean => {
    const text = line.trim().replace(/:$/u, "")
    return text.length > 4 && text.startsWith("**") && text.endsWith("**") && !text.slice(2, -2).includes("*")
}

/** The language folder a code block names (`workspace/1-java/...`), or undefined. */
const folderOfBlock = (block: string): string | undefined => /workspace\/\d+-([a-z]+)(?![a-z])/u.exec(block)?.[1]

/**
 * The raw markdown without the command blocks of the other languages, each with the bold label line before it; a fence with no
 * language folder stays. The source is the one Grammar's Markdown draws.
 */
export const markdownForLanguage = (source: string, language: string): string => {
    const lines = source.split("\n")
    const removed = new Set<number>()
    for (const span of fencesOf(lines)) {
        const folder = folderOfBlock(lines.slice(span.start, span.end + 1).join("\n"))
        if (folder === undefined || folder === language) continue
        for (let index = span.start; index <= span.end; index += 1) removed.add(index)
        const before = lines[span.start - 1]
        if (before !== undefined && isLabelLine(before)) removed.add(span.start - 1)
    }
    return lines.filter((_, index) => !removed.has(index)).join("\n")
}

/** The part number (1 to 4) the back end names as the one to continue; the first part not done when it names none, 0 when all four are. */
const currentPartOf = (inProgressPart: string | null, doneParts: number): number => {
    const named = (ESSENTIAL_PARTS as ReadonlyArray<string | null>).indexOf(inProgressPart)
    if (named !== -1) return named + 1
    return doneParts >= LESSON_PART_COUNT ? 0 : doneParts + 1
}

/** The state of a part the back end names; anything unknown reads as not started. */
const partStateOf = (state: string): "none" | "doing" | "done" | "locked" =>
    state === "doing" || state === "done" || state === "locked" ? state : "none"

/** The four parts of each lesson of the answer, by lesson id: how many are finished, which to continue and the opener score. */
export const lessonPartsOf = (wire: LessonPartsProgressQuery): Readonly<Record<string, LessonPartsView>> =>
    Object.fromEntries(
        wire.lessonPartsProgress.map((lesson) => {
            const doneParts = lesson.parts.filter((part) => part.state === "done").length
            return [
                lesson.lessonId,
                {
                    parts: lesson.parts.map((part) => ({
                        part: part.part,
                        state: partStateOf(part.state),
                        done: part.done,
                        total: part.total,
                    })),
                    doneParts,
                    currentPart: currentPartOf(lesson.inProgressPart, doneParts),
                    isUnderWay: lesson.parts.some((part) => part.state === "doing"),
                    isStarted:
                        lesson.opener.answered > 0 ||
                        lesson.parts.some((part) => part.state === "doing" || part.state === "done"),
                    openerRight: lesson.opener.answered === 0 ? undefined : lesson.opener.latestCorrect,
                    openerAnswered: lesson.opener.answered,
                },
            ]
        }),
    )

/** The state of a rung the back end names; anything else is a contract break and stops here. */
const challengeStateOf = (raw: string): ChallengeScoreView["state"] => {
    if (raw === "locked" || raw === "open" || raw === "doing" || raw === "passed") return raw
    throw new Error(`unknown challenge state ${raw}`)
}

/** The level of a rung the back end names; anything else is a contract break and stops here. */
const challengeLevelOf = (raw: string): ChallengeLevel => {
    const level = CHALLENGE_LEVELS.find((each) => each === raw)
    if (level === undefined) throw new Error(`unknown challenge level ${raw}`)
    return level
}

/** The score of each rung of the answer, in ladder order. */
export const challengeScoresOf = (wire: LessonChallengeScoresQuery): ReadonlyArray<ChallengeScoreView> =>
    wire.lessonChallengeScores.map((rung) => ({
        challengeId: rung.challengeId,
        level: challengeLevelOf(rung.level),
        state: challengeStateOf(rung.state),
        score: rung.score,
        maxScore: rung.maxScore,
        isLocked: rung.isLocked,
        isPassed: rung.isPassed,
        unlocksNext: rung.unlocksNext,
        hiddenGreen: rung.hiddenGreen,
        hiddenTotal: rung.hiddenTotal,
        isCriticalMet: rung.isCriticalMet,
        criteria: rung.criteria,
    }))
