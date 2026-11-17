import { ESSENTIAL_PARTS, type EssentialPart } from "@modules/domain/entitlement"
import type { LessonOpenerAnswerView, LessonView } from "@modules/domain/lesson"
import { headingsOf, markdownChunksOf } from "./mcp-chunk.policy"
import type { Chunk } from "./mcp-embedding.policy"
import type { McpLesson, McpLessonSection, McpOpenerQuestion } from "./mcp.contracts"

/** One readable document of a lesson: a section body, or a structured part written out as markdown. */
export interface McpDoc {
    /** The Essentials part it belongs to, or null (overview, a section of a lesson without the four parts). */
    readonly part: EssentialPart | null
    /** The path a search hit shows: `overview`, `section/<n>`, `opener/<id>`, `scenario/<id>`… */
    readonly path: string
    /** The title. */
    readonly title: string
    /** The markdown text. */
    readonly text: string
}

type Locale = "vi" | "en"

/** The few labels the structured documents carry, in the lesson's language. */
interface Labels {
    readonly question: string
    readonly choices: string
    readonly invariants: string
    readonly architecture: string
    readonly components: string
    readonly codeWalk: string
    readonly scenario: string
    readonly fault: string
    readonly command: string
    readonly guards: string
    readonly expected: string
    readonly invariant: string
    readonly challenge: string
    readonly brief: string
    readonly rubric: string
    readonly essence: string
    readonly why: string
    readonly none: string
    readonly overview: string
    readonly outcomes: string
}

const LABELS: Record<Locale, Labels> = {
    vi: {
        question: "Câu hỏi",
        choices: "Lựa chọn",
        invariants: "Các luật (invariant)",
        architecture: "Kiến trúc",
        components: "Thành phần",
        codeWalk: "Đi qua code",
        scenario: "Kịch bản",
        fault: "Lỗi được bơm",
        command: "Lệnh chạy",
        guards: "Guard có thể tắt",
        expected: "Kết quả đúng",
        invariant: "Luật được kiểm",
        challenge: "Thử thách",
        brief: "Đề bài",
        rubric: "Tiêu chí chấm",
        essence: "Câu hỏi bản chất",
        why: "Vì sao viết vậy",
        none: "không có",
        overview: "Tổng quan",
        outcomes: "Mục tiêu học",
    },
    en: {
        question: "Question",
        choices: "Choices",
        invariants: "Invariants",
        architecture: "Architecture",
        components: "Components",
        codeWalk: "Code walk",
        scenario: "Scenario",
        fault: "Injected fault",
        command: "Command",
        guards: "Guards that can be switched off",
        expected: "Expected result",
        invariant: "Invariant it checks",
        challenge: "Challenge",
        brief: "Brief",
        rubric: "Rubric",
        essence: "Essence questions",
        why: "Why it is written so",
        none: "none",
        overview: "Overview",
        outcomes: "Learning outcomes",
    },
}

const labelsOf = (locale: string): Labels => LABELS[locale === "en" ? "en" : "vi"]

const partOf = (id: string): EssentialPart | null => ESSENTIAL_PARTS.find((part) => part === id) ?? null

const letter = (index: number): string => String.fromCharCode(65 + index)

/**
 * The readable documents of a lesson view, in reading order: the overview, each readable section (`section/<n>`, the number the
 * outline and the resource use) and, for a lesson with the four parts, the opener questions, the invariants, the architecture,
 * the code walk, the scenarios and the challenges the view carries. A locked part has no document, so what is not in the view is
 * never embedded, searched or returned. The key of an opener question, a scenario hint and a hidden scenario are not in a view.
 */
export const lessonDocsOf = (view: LessonView): Array<McpDoc> => {
    const label = labelsOf(view.locale)
    const docs: Array<McpDoc> = []
    const overview = [
        `# ${view.title}`,
        view.description,
        view.overview,
        view.learningOutcomes.length === 0
            ? ""
            : `## ${label.outcomes}\n\n${view.learningOutcomes.map((outcome) => `- ${outcome.text}`).join("\n")}`,
    ]
        .filter((part) => part.trim() !== "")
        .join("\n\n")
    docs.push({ part: null, path: "overview", title: label.overview, text: overview })
    view.sections.forEach((section, index) => {
        if (section.locked || section.body === null || section.body.trim() === "") return
        docs.push({
            part: view.essential === null ? null : partOf(section.id),
            path: `section/${index + 1}`,
            title: section.title,
            text: section.body,
        })
    })
    const essential = view.essential
    if (essential === null) return docs
    essential.opener.forEach((question) => {
        docs.push({
            part: "1-essential",
            path: `opener/${question.id}`,
            title: question.prompt,
            text: [
                `# ${label.question}`,
                question.prompt,
                `## ${label.choices}`,
                question.choices.map((choice, index) => `${letter(index)}. ${choice.label}`).join("\n"),
            ].join("\n\n"),
        })
    })
    if (essential.invariants.length > 0)
        docs.push({
            part: "2-source",
            path: "invariants",
            title: label.invariants,
            text: [
                `# ${label.invariants}`,
                essential.invariants.map((rule) => `- **${rule.id}**: ${rule.text}`).join("\n"),
            ].join("\n\n"),
        })
    if (essential.architecture !== null)
        docs.push({
            part: "2-source",
            path: "architecture",
            title: label.architecture,
            text: [
                `# ${label.architecture}`,
                `\`\`\`mermaid\n${essential.architecture.diagram}\n\`\`\``,
                `## ${label.components}`,
                essential.architecture.components
                    .map(
                        (component) =>
                            `- **${component.name}**${component.port === null ? "" : ` (${component.port})`}${component.role === null ? "" : `: ${component.role}`} [${component.invariants.join(", ")}]`,
                    )
                    .join("\n"),
            ].join("\n\n"),
        })
    essential.codeWalk.forEach((entry) => {
        docs.push({
            part: "2-source",
            path: `codewalk/${entry.id}`,
            title: entry.title,
            text: [
                `# ${entry.title}`,
                `${entry.file}:${entry.line} (${label.invariant}: ${entry.invariant})`,
                `\`\`\`ts\n${entry.snippet}\n\`\`\``,
                entry.why === null ? "" : `## ${label.why}\n\n${entry.why}`,
            ]
                .filter((part) => part !== "")
                .join("\n\n"),
        })
    })
    essential.scenarios.forEach((scenario) => {
        docs.push({
            part: "3-scenarios",
            path: `scenario/${scenario.id}`,
            title: scenario.title,
            text: [
                `# ${label.scenario}: ${scenario.title}`,
                `- ${label.fault}: ${scenario.fault}`,
                `- ${label.command}: \`${scenario.command}\``,
                `- ${label.invariant}: ${scenario.invariant === "" ? label.none : scenario.invariant}`,
                `- ${label.guards}: ${scenario.guards.length === 0 ? label.none : scenario.guards.join(", ")}`,
                scenario.expected === "" ? "" : `## ${label.expected}\n\n${scenario.expected}`,
            ]
                .filter((part) => part !== "")
                .join("\n"),
        })
    })
    essential.challenges.forEach((challenge) => {
        docs.push({
            part: "4-apply",
            path: `challenge/${challenge.id}`,
            title: challenge.title,
            text: [
                `# ${label.challenge} ${challenge.level}: ${challenge.title}`,
                `## ${label.brief}\n\n${challenge.brief}`,
                `## ${label.rubric}\n\n${challenge.rubric.map((item) => `- ${item.criterion} (${item.points}${item.isCritical ? ", *" : ""})`).join("\n")}`,
                challenge.questions.length === 0
                    ? ""
                    : `## ${label.essence}\n\n${challenge.questions
                          .map(
                              (question) =>
                                  `${question.prompt}\n${question.choices.map((choice, index) => `${letter(index)}. ${choice.label}`).join("\n")}`,
                          )
                          .join("\n\n")}`,
            ]
                .filter((part) => part !== "")
                .join("\n\n"),
        })
    })
    return docs
}

/** The chunks of a lesson's documents: markdown cut by heading, each titled by its document and heading trail. */
export const lessonChunksOf = (lessonId: string, docs: ReadonlyArray<McpDoc>): Array<Chunk> =>
    docs.flatMap((doc) =>
        markdownChunksOf(doc.path, doc.text).map((chunk): Chunk => {
            const title =
                chunk.title === null || chunk.title === undefined
                    ? doc.title
                    : chunk.title.startsWith(doc.title)
                      ? chunk.title
                      : `${doc.title} > ${chunk.title}`
            return { ...chunk, title, context: `${lessonId}/${doc.path} · ${title}` }
        }),
    )

/**
 * The chunks of both readers' documents with their access class: a chunk whose document is also in the free reader's view is
 * `free`, every other chunk `premium`. `all` is the Premium reader's documents (everything), `open` the free reader's.
 */
export const lessonChunksWithAccessOf = (
    lessonId: string,
    all: ReadonlyArray<McpDoc>,
    open: ReadonlyArray<McpDoc>,
): Array<Chunk> => {
    const free = new Set(open.map((doc) => `${doc.path}\u0000${doc.text}`))
    return all.flatMap((doc) =>
        lessonChunksOf(lessonId, [doc]).map((chunk): Chunk => ({
            ...chunk,
            access: free.has(`${doc.path}\u0000${doc.text}`) ? "free" : "premium",
        })),
    )
}

/** What shapes a whole-lesson answer: the part asked for, the answers released and the scenarios the learner's run turned red. */
export interface McpLessonOptions {
    /** One part only, or null for every part the learner may read. */
    readonly part: EssentialPart | null
    /** The released answer key of the opener questions the learner submitted. */
    readonly answers: ReadonlyArray<LessonOpenerAnswerView>
    /** The ids of the scenarios whose newest run of the learner is red: only their hints are shown. */
    readonly redScenarios: ReadonlySet<string>
}

const sectionOf = (view: LessonView, index: number): McpLessonSection => {
    const section = view.sections[index]
    if (section === undefined) throw new RangeError("section out of range")
    return {
        n: index + 1,
        id: section.id,
        part: view.essential === null ? null : partOf(section.id),
        phase: section.phase,
        title: section.title,
        locked: section.locked,
        body: section.locked ? null : section.body,
        headings: section.locked || section.body === null ? [] : headingsOf(section.body),
    }
}

/**
 * The whole lesson the learner may read, from the lesson read's own view: every unlocked section in full, the opener with the key
 * of the questions the learner answered, the invariants, architecture, code walk, scenarios (a hint only after a red run) and
 * the challenges as the page shows them. A locked part carries no text, only its name in `lockedParts`.
 */
export const lessonOf = (view: LessonView, options: McpLessonOptions): McpLesson => {
    const essential = view.essential
    const wants = (...parts: ReadonlyArray<EssentialPart>): boolean =>
        options.part === null || parts.includes(options.part)
    const keyOf = new Map(options.answers.map((answer) => [answer.questionId, answer]))
    const opener = (wants("1-essential") ? (essential?.opener ?? []) : []).map((question): McpOpenerQuestion => {
        const key = keyOf.get(question.id)
        return {
            id: question.id,
            prompt: question.prompt,
            choices: question.choices.map((choice, index) => ({
                id: choice.id,
                label: choice.label,
                ...(key === undefined
                    ? {}
                    : {
                          isCorrect: key.choices[index]?.isCorrect === true,
                          explanation: key.choices[index]?.explanation ?? "",
                      }),
            })),
            sectionRef: question.sectionRef,
            scenarioId: question.scenarioId,
            answered: key !== undefined,
            answer: key === undefined ? null : { correctChoiceId: key.correctChoiceId, explanation: key.explanation },
        }
    })
    return {
        id: view.id,
        version: view.version,
        locale: view.locale,
        title: view.title,
        description: view.description,
        topic: view.topic.title,
        outcomes: view.learningOutcomes.map((outcome) => outcome.text),
        prerequisites: view.prerequisites.map((item) => item.text),
        references: view.references.map((reference) => ({
            label: reference.label,
            url: reference.url,
            citation: reference.citation,
        })),
        isPremium: view.isPremium,
        lockedParts: essential?.lockedParts ?? [],
        sections: view.sections
            .map((_, index) => sectionOf(view, index))
            .filter((section) => options.part === null || section.part === options.part),
        opener,
        invariants: wants("2-source", "3-scenarios") ? (essential?.invariants ?? []) : [],
        architecture: wants("2-source") ? (essential?.architecture ?? null) : null,
        codeWalk: wants("2-source") ? (essential?.codeWalk ?? []) : [],
        scenarios: (wants("3-scenarios") ? (essential?.scenarios ?? []) : []).map((scenario) => ({
            id: scenario.id,
            title: scenario.title,
            fault: scenario.fault,
            command: scenario.command,
            expected: scenario.expected,
            invariant: scenario.invariant,
            guards: scenario.guards,
            hint: options.redScenarios.has(scenario.id) ? scenario.hint : null,
        })),
        challenges: (wants("4-apply") ? (essential?.challenges ?? []) : []).map((challenge) => ({
            id: challenge.id,
            level: challenge.level,
            title: challenge.title,
            brief: challenge.brief,
            rubric: challenge.rubric.map((item) => ({
                id: item.id,
                criterion: item.criterion,
                points: item.points,
                isCritical: item.isCritical,
            })),
            hiddenScenarios: challenge.hiddenScenarios,
            questions: challenge.questions.map((question) => ({
                id: question.id,
                prompt: question.prompt,
                choices: question.choices.map((choice) => ({ id: choice.id, label: choice.label })),
            })),
        })),
    }
}
