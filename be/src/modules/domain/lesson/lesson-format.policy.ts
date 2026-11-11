import { shapeIssues, type ObjectShape, type ShapeIssue, type LessonShape } from "./shape.policy"
import { LESSON_WORKSPACE_LANGUAGES, type LessonRootFile, type LessonSectionFile } from "./lesson.contracts"

/** The categories the content format knows. */
export const LESSON_CATEGORIES: ReadonlyArray<string> = [
    "backend",
    "frontend",
    "system-design",
    "testing",
    "devops",
    "cloud",
    "ai-harness",
    "security",
]

/** The phases of a section, in learning order. */
export const LESSON_PHASES: ReadonlyArray<string> = ["challenge", "predict", "explore", "explain", "apply", "reflect"]

const text: LessonShape = "string"

const list = (items: LessonShape): LessonShape => ({ items })

const statement: ObjectShape = { required: { id: text, text } }

const reference: ObjectShape = { required: { id: text, label: text, citation: text }, optional: { url: text } }

const criterion: ObjectShape = {
    required: { id: text, criterion: text, expectedEvidence: text, misconception: text, maxScore: "positive" },
}

const option: ObjectShape = { required: { id: text, label: text, explanation: text, isCorrect: "boolean" } }

const simulation: ObjectShape = {
    required: {
        engine: text,
        initialStateId: text,
        debriefQuestion: text,
        states: list({
            required: { id: text, label: text, observation: text, isSuccess: "boolean" },
            optional: { facts: list({ required: { label: text, value: text } }) },
        }),
        actions: list({ required: { id: text, label: text }, optional: { isBranch: "boolean" } }),
        transitions: list({ required: { id: text, fromStateId: text, actionId: text, toStateId: text } }),
    },
}

const exercise: ObjectShape = {
    required: { submissionInstructions: text, verificationMode: text },
    optional: {
        files: list({ required: { relativePath: text, role: text, syntaxLanguage: text, content: text } }),
    },
}

const activity: ObjectShape = {
    required: {
        id: text,
        kind: { oneOf: ["explain", "choice", "simulation", "exercise", "retrieval"] },
        prompt: text,
        outcomeIds: list(text),
    },
    optional: {
        stableKey: text,
        responseKind: text,
        evaluationMethod: text,
        isDiagnostic: "boolean",
        feedbackRelease: text,
        afterDays: "positive",
        hints: list(text),
        rubric: list(criterion),
        answer: { required: { explanation: text }, optional: { sampleAnswer: text, misconception: text } },
        options: list(option),
        simulation,
        exercise,
    },
}

const workspace: ObjectShape = {
    required: {
        runtime: text,
        files: list({ required: { path: text, role: text } }),
        commands: { required: {}, optional: { windows: text, unix: text } },
    },
}

const workspaceVariant: ObjectShape = {
    required: {
        language: { oneOf: LESSON_WORKSPACE_LANGUAGES },
        runtime: text,
        files: list({ required: { path: text, role: text } }),
        commands: { required: {}, optional: { windows: text, unix: text } },
    },
}

/** The shape of a root file once its json and number fields are decoded. */
export const ROOT_SHAPE: ObjectShape = {
    required: {
        title: text,
        description: text,
        category: { oneOf: LESSON_CATEGORIES },
        difficulty: { oneOf: ["foundation", "intermediate", "advanced"] },
        minutesRead: "positive",
        implementation: text,
        sortIndex: "integer",
        body: text,
        learningOutcomes: list(statement),
        prerequisites: list(statement),
        references: list(reference),
    },
    optional: { activities: list(activity), workspace, workspaces: list(workspaceVariant), isPremium: "boolean" },
}

/** The shape of a section file once its json and number fields are decoded. */
export const SECTION_SHAPE: ObjectShape = {
    required: { title: text, phase: { oneOf: LESSON_PHASES }, sortIndex: "integer", body: text },
    optional: { activities: list(activity), isPremium: "boolean" },
}

/** True when the decoded fields of a root file fit the content format. */
export const isRootFile = (value: unknown): value is LessonRootFile => shapeIssues(value, ROOT_SHAPE).length === 0

/** True when the decoded fields of a section file fit the content format. */
export const isSectionFile = (value: unknown): value is LessonSectionFile =>
    shapeIssues(value, SECTION_SHAPE).length === 0

/** Lists where decoded root fields depart from the content format. */
export const rootIssues = (value: unknown): Array<ShapeIssue> => shapeIssues(value, ROOT_SHAPE)

/** Lists where decoded section fields depart from the content format. */
export const sectionIssues = (value: unknown): Array<ShapeIssue> => shapeIssues(value, SECTION_SHAPE)
