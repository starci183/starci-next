import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import type { EntityManager } from "typeorm"
import { sql } from "@modules/platform/database"
import { builder } from "@starci/jest-preset"
import type {
    LessonActivity,
    LessonActivityParams,
    LessonContent,
    LessonLocale,
    LessonLocaleDocument,
    LessonTopicCatalog,
    LessonTopicStep,
    LessonPhase,
    LessonRootFile,
    LessonSection,
    LessonSimulation,
    LessonSourceFile,
    LessonWorkspaceFile,
} from "@modules/domain/lesson"

/** The V1 content folder the demo lesson was converted from, as its legacy reference names it. */
export const DEMO_SOURCE_KEY = "courses/demo-course/modules/0-demo-module/contents/1-second"

/** The marker line of the separator field format. */
export const SEPARATOR_LINE = "<!-- @starci/seperator -->"

/** The text every private field of the demo content carries, so a spec can prove a projection never leaks it. */
export const SECRET = "SECRET"

/** The fields of one content file, as the author wrote them: text stays text, numbers print, lists and objects are json. */
export type DemoFields = object

const text = (locale: LessonLocale, value: string): string => `${locale}: ${value}`

/** Writes fields in the separator format: `# name`, the marker, the value, the marker. */
export const separatorTextOf = (fields: DemoFields): string =>
    Object.entries(fields)
        .map(([name, value]) => {
            const body = typeof value === "string" ? value : JSON.stringify(value, null, 2)
            return `# ${name}\n${SEPARATOR_LINE}\n${body}\n${SEPARATOR_LINE}\n`
        })
        .join("\n")

/** A source file with the hash of its text. */
export const sourceFileOf = (path: string, content: string): LessonSourceFile => ({
    path,
    text: content,
    sha256: createHash("sha256").update(content).digest("hex"),
})

/** An explain activity graded by a rubric whose evidence, misconception and answer are private. */
export const explainActivityOf = (locale: LessonLocale, id = "demo--interview"): LessonActivity => ({
    id,
    kind: "explain",
    prompt: text(locale, "Explain how a read model goes stale."),
    stableKey: "interview",
    responseKind: "written-explanation",
    evaluationMethod: "ai-rubric",
    isDiagnostic: true,
    feedbackRelease: "after-submit",
    outcomeIds: ["demo--o1", "demo--o2"],
    hints: [`${SECRET} hint`],
    rubric: [
        {
            id: `${id}--c1`,
            criterion: text(locale, "Mechanism"),
            expectedEvidence: `${SECRET} evidence one`,
            misconception: `${SECRET} misconception one`,
            maxScore: 2,
        },
        {
            id: `${id}--c2`,
            criterion: text(locale, "Limits"),
            expectedEvidence: `${SECRET} evidence two`,
            misconception: `${SECRET} misconception two`,
            maxScore: 3,
        },
    ],
    answer: {
        explanation: `${SECRET} answer explanation`,
        sampleAnswer: `${SECRET} sample answer`,
        misconception: `${SECRET} answer misconception`,
    },
})

/** A single-choice activity: one correct option, each with an explanation released after the submit. */
export const choiceActivityOf = (locale: LessonLocale, id = "demo--predict"): LessonActivity => ({
    id,
    kind: "choice",
    prompt: text(locale, "What does the read API return now?"),
    responseKind: "single-choice",
    evaluationMethod: "deterministic",
    isDiagnostic: false,
    outcomeIds: ["demo--o1"],
    answer: { explanation: `${SECRET} choice answer` },
    options: [
        { id: `${id}--1`, label: text(locale, "The old name"), explanation: `${SECRET} right`, isCorrect: true },
        { id: `${id}--2`, label: text(locale, "The new name"), explanation: `${SECRET} wrong`, isCorrect: false },
        { id: `${id}--3`, label: text(locale, "An error"), explanation: `${SECRET} also wrong`, isCorrect: false },
    ],
})

/** A simulation whose first action leads on and whose second reaches the success state. */
export const simulationOf = (locale: LessonLocale, id = "demo--explore"): LessonSimulation => ({
    engine: "state-machine",
    initialStateId: `${id}--s0`,
    debriefQuestion: text(locale, "Why did the second step succeed?"),
    states: [
        { id: `${id}--s0`, label: text(locale, "Start"), observation: text(locale, "Nothing yet."), isSuccess: false },
        {
            id: `${id}--s1`,
            label: text(locale, "Written"),
            observation: text(locale, "Write is ahead."),
            isSuccess: false,
        },
        {
            id: `${id}--s2`,
            label: text(locale, "Caught up"),
            observation: text(locale, "Both agree."),
            isSuccess: true,
        },
    ],
    actions: [
        { id: `${id}--a1`, label: text(locale, "Send the command") },
        { id: `${id}--a2`, label: text(locale, "Run the projection") },
    ],
    transitions: [
        { id: `${id}--t1`, fromStateId: `${id}--s0`, actionId: `${id}--a1`, toStateId: `${id}--s1` },
        { id: `${id}--t2`, fromStateId: `${id}--s1`, actionId: `${id}--a2`, toStateId: `${id}--s2` },
    ],
})

/** A simulation activity over the demo simulation. */
export const simulationActivityOf = (locale: LessonLocale, id = "demo--explore"): LessonActivity => ({
    id,
    kind: "simulation",
    prompt: text(locale, "Try both paths."),
    outcomeIds: ["demo--o1"],
    simulation: simulationOf(locale, id),
})

/** An exercise activity with a rubric and the files it hands the learner. */
export const exerciseActivityOf = (locale: LessonLocale, id = "demo--practice"): LessonActivity => ({
    id,
    kind: "exercise",
    prompt: text(locale, "Break the guard and log the failing test."),
    responseKind: "artifact-and-explanation",
    evaluationMethod: "ai-rubric",
    outcomeIds: ["demo--o2"],
    rubric: [
        {
            id: `${id}--c1`,
            criterion: text(locale, "Result"),
            expectedEvidence: `${SECRET} practice evidence`,
            misconception: `${SECRET} practice misconception`,
            maxScore: 2,
        },
    ],
    answer: { explanation: `${SECRET} practice answer` },
    exercise: {
        submissionInstructions: text(locale, "Submit the log."),
        verificationMode: "reasoning",
        files: [
            {
                relativePath: "source.ts",
                role: "reference",
                syntaxLanguage: "typescript",
                content: "export const a = 1",
            },
        ],
    },
})

/** A review activity scheduled a day after completion. */
export const retrievalActivityOf = (locale: LessonLocale, id = "demo--review"): LessonActivity => ({
    id,
    kind: "retrieval",
    prompt: text(locale, "A day later: what stays stale?"),
    responseKind: "written-explanation",
    evaluationMethod: "ai-rubric",
    outcomeIds: ["demo--o1"],
    afterDays: 1,
    rubric: [
        {
            id: `${id}--c1`,
            criterion: text(locale, "Cause"),
            expectedEvidence: `${SECRET} review evidence`,
            misconception: `${SECRET} review misconception`,
            maxScore: 2,
        },
    ],
    answer: { explanation: `${SECRET} review answer` },
})

const section = (
    locale: LessonLocale,
    id: string,
    phase: LessonPhase,
    sortIndex: number,
    activities: ReadonlyArray<LessonActivity>,
): LessonSection => ({
    id,
    phase,
    sortIndex,
    title: text(locale, `Section ${id}`),
    body: text(locale, `Body of ${id}`),
    ...(activities.length === 0 ? {} : { activities }),
})

/** The six demo sections of a locale, one per phase, with their activities. */
export const demoSectionsOf = (locale: LessonLocale): Array<LessonSection> => [
    section(locale, "0-interview", "challenge", 0, [explainActivityOf(locale)]),
    section(locale, "1-prediction", "predict", 1, [choiceActivityOf(locale)]),
    section(locale, "2-experiment", "explore", 2, [simulationActivityOf(locale)]),
    section(locale, "3-theory", "explain", 3, []),
    section(locale, "4-practice", "apply", 4, [exerciseActivityOf(locale)]),
    section(locale, "5-reflection", "reflect", 5, [explainActivityOf(locale, "demo--final")]),
]

/** The decoded root fields of a locale of the demo lesson. */
export const demoRootOf = (locale: LessonLocale): LessonRootFile => ({
    title: text(locale, "Demo lesson"),
    description: text(locale, "One concept to test the import."),
    category: "backend",
    difficulty: "intermediate",
    minutesRead: 95,
    implementation: "typescript",
    sortIndex: 2,
    body: text(locale, "Overview"),
    learningOutcomes: [
        { id: "demo--o1", text: text(locale, "Explain staleness") },
        { id: "demo--o2", text: text(locale, "Fix the projection") },
    ],
    prerequisites: [{ id: "demo--p1", text: text(locale, "Know transactions") }],
    references: [
        { id: "demo--r1", label: "Docs", url: "https://example.test/docs", citation: text(locale, "official") },
        {
            id: "demo--r2",
            label: "Legacy",
            citation: `legacy; ${DEMO_SOURCE_KEY}/bodies/0-typescript/vi.md; git abc; ${locale}`,
        },
    ],
    activities: [retrievalActivityOf(locale)],
    workspace: {
        runtime: "Node.js 24",
        files: [
            { path: "workspace/source.test.ts", role: "test" },
            { path: "workspace/source.ts", role: "source" },
        ],
        commands: { windows: "node --test workspace/source.test.ts" },
    },
})

/** The workspace files of the demo lesson with their text. */
export const demoWorkspaceFiles: ReadonlyArray<LessonWorkspaceFile> = [
    { path: "workspace/source.test.ts", role: "test", content: "export const test = 1\n" },
    { path: "workspace/source.ts", role: "source", content: "export const source = 1\n" },
]

/** The files of a locale: its root and its sections, written in the separator format. */
export const demoLocaleFilesOf = (
    locale: LessonLocale,
    root: DemoFields = demoRootOf(locale),
    sections: ReadonlyArray<LessonSection> = demoSectionsOf(locale),
): Array<LessonSourceFile> => [
    sourceFileOf(`${locale}.md`, separatorTextOf(root)),
    ...sections.map(({ id, ...fields }) => sourceFileOf(`sections/${id}/${locale}.md`, separatorTextOf(fields))),
]

/** One locale of the demo lesson as it is stored. */
export const demoLocaleDocumentOf = (locale: LessonLocale): LessonLocaleDocument => {
    const root = demoRootOf(locale)
    return {
        title: root.title,
        description: root.description,
        body: root.body,
        learningOutcomes: root.learningOutcomes,
        prerequisites: root.prerequisites,
        references: root.references,
        retrieval: root.activities ?? [],
        sections: demoSectionsOf(locale),
    }
}

/** The whole stored content of the demo lesson. */
export const demoContentOf = (): LessonContent => ({
    locales: { vi: demoLocaleDocumentOf("vi"), en: demoLocaleDocumentOf("en") },
    workspace: demoRootOf("vi").workspace ?? null,
    files: demoWorkspaceFiles,
})

/** The topic catalog of the demo lessons: a topic with two source modules and page copy, and one with neither. */
export const demoTopicCatalogOf = (): LessonTopicCatalog => ({
    byLesson: {
        "demo-lesson": "demo-topic",
        first: "demo-topic",
        same: "demo-topic",
        fixed: "demo-topic",
        moving: "demo-topic",
        steady: "demo-topic",
        alpha: "demo-topic",
        beta: "plain-topic",
        graded: "demo-topic",
        "cqrs-read-models": "demo-topic",
        "new-lesson": "demo-topic",
        clash: "clash",
        looped: "demo-lesson",
        lost: "lost-topic",
    },
    sources: {},
    topics: {
        "demo-topic": {
            title: "Demo topic",
            from: "Demo course module 0 and 1",
            modules: [
                { course: "demo-course", index: 0 },
                { course: "demo-course", index: 1 },
            ],
            details: {
                description: "About the demo topic.",
                prerequisites: ["Know the demo."],
                related: ["plain-topic"],
            },
        },
        "plain-topic": { title: "Plain topic", from: "Nowhere", modules: [] },
        clash: { title: "Clash", from: "Nowhere", modules: [] },
    },
})

/** The path rows a source module reads as: one content folder per row, titled in both locales. */
export const demoModuleStepsOf = (index: number): Array<LessonTopicStep> =>
    [0, 1].map((position) => ({
        order: position + 1,
        key: `courses/demo-course/modules/${index}-demo-module/contents/${position}-${position === 1 ? "second" : "first"}`,
        titles: { vi: `vi: Step ${index}.${position}`, en: `en: Step ${index}.${position}` },
    }))

/** The whole demo folder: both locales and the workspace files, valid as it stands. */
export const demoFilesOf = (): Array<LessonSourceFile> => [
    ...demoLocaleFilesOf("vi"),
    ...demoLocaleFilesOf("en"),
    ...demoWorkspaceFiles.map((file) => sourceFileOf(file.path, file.content)),
]

/** Writes the files of one concept folder under a directory, creating the folders on the way. */
export const writeFolder = async (
    directory: string,
    folder: string,
    files: ReadonlyArray<LessonSourceFile>,
): Promise<void> => {
    await Promise.all(
        files.map(async (file) => {
            const target = join(directory, folder, ...file.path.split("/"))
            await mkdir(dirname(target), { recursive: true })
            await writeFile(target, file.text)
        }),
    )
}

const INSERT_LESSON = sql`INSERT INTO lesson_versions (
    lesson_id, version, content_hash, status, category, difficulty, minutes_read, implementation, sort_index,
    titles, descriptions, source_hashes, content, imported_at, lesson_group, topic, source_key
) VALUES ($1, $2, $3, 'published', 'backend', 'intermediate', 95, 'typescript', 2,
    $4::jsonb, $5::jsonb, '{}'::jsonb, $6::jsonb, now(), 'backend', 'demo-topic', 'courses/demo-course/modules/0-demo-module/contents/1-second')
ON CONFLICT DO NOTHING`

const INSERT_PREMIUM = sql`INSERT INTO entitlements (learner_id, premium_until, updated_at)
VALUES ($1::uuid, $2::timestamptz, now())`

/** The facts of a lesson version a door spec stores directly. */
export interface StoredLesson {
    readonly id: string
    readonly version: string
}

/** Stores the demo lesson as the live version of an id, the way an import leaves it, and answers what it stored. */
export const persistDemoLesson = async (
    manager: EntityManager | undefined,
    overrides: Partial<StoredLesson> = {},
): Promise<StoredLesson> => {
    const stored = { id: "demo-lesson", version: "v1", ...overrides }
    const content = demoContentOf()
    await manager?.query(INSERT_LESSON, [
        stored.id,
        stored.version,
        "0".repeat(64),
        JSON.stringify({ vi: content.locales.vi.title, en: content.locales.en.title }),
        JSON.stringify({ vi: content.locales.vi.description, en: content.locales.en.description }),
        JSON.stringify(content),
    ])
    return stored
}

/** Gives a learner Premium until a future instant. */
export const persistPremium = async (manager: EntityManager | undefined, learnerId: string): Promise<void> => {
    await manager?.query(INSERT_PREMIUM, [learnerId, "2099-01-01T00:00:00.000Z"])
}

/** The activity of the demo lesson a grading call asks for; override the field that matters to the case. */
export const activityParamsOf: (overrides?: Partial<LessonActivityParams>) => LessonActivityParams =
    builder<LessonActivityParams>({
        lessonId: "demo-lesson",
        version: "v1",
        activityId: "demo--predict",
        locale: "vi",
    })

const INSERT_TOPIC = sql`INSERT INTO lesson_topics (topic, title, source_note, description, prerequisites, related, path, ref, imported_at)
VALUES ('demo-topic', 'Demo topic', 'Demo course module 0', 'About the demo topic.', '["Know the demo."]'::jsonb,
    '["plain-topic"]'::jsonb, $1::jsonb, 'v1', now())
ON CONFLICT DO NOTHING`

/** Stores the demo topic with the path of one source module, as an import leaves it. */
export const persistDemoTopic = async (manager: EntityManager | undefined): Promise<void> => {
    await manager?.query(INSERT_TOPIC, [JSON.stringify(demoModuleStepsOf(0))])
}
