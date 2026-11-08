import type { CatalogRow, VersionRow } from "./persistence/lesson.rows"
import { LESSON_FREE_PHASE, type LessonActivity, type LessonLocale, type LessonSection } from "./lesson.contracts"
import type {
    LessonActivityView,
    LessonCatalogItemView,
    LessonSectionView,
    LessonView,
    LessonWorkspaceView,
} from "./lesson-read.contracts"

/** The implementation languages of a lesson: none for a concept that is language-agnostic. */
const languagesOf = (implementation: string): Array<string> => (implementation === "agnostic" ? [] : [implementation])

/** Maps a catalog row to the item the catalog lists. */
export const toCatalogItem = (row: CatalogRow): LessonCatalogItemView => ({
    id: row.lesson_id,
    version: row.version,
    title: row.title,
    description: row.description,
    category: row.category,
    group: row.lesson_group,
    topic: { id: row.topic, title: row.topic_title },
    difficulty: row.difficulty,
    minutes: row.minutes_read,
    languages: languagesOf(row.implementation),
    providers: [],
})

/**
 * Builds the activity a learner may see before a submit, field by field: the prompt, the names of the criteria, the
 * options without their correctness or explanation, and the playable parts. The stored answer, the rubric evidence, the
 * misconceptions and the hints are never copied.
 */
const toActivityView = (activity: LessonActivity): LessonActivityView => ({
    id: activity.id,
    kind: activity.kind,
    prompt: activity.prompt,
    responseKind: activity.responseKind ?? null,
    evaluationMethod: activity.evaluationMethod ?? null,
    isDiagnostic: activity.isDiagnostic ?? false,
    outcomeIds: [...activity.outcomeIds],
    criteria: (activity.rubric ?? []).map((criterion) => ({
        id: criterion.id,
        criterion: criterion.criterion,
        maxScore: criterion.maxScore,
    })),
    options: (activity.options ?? []).map((option) => ({ id: option.id, label: option.label })),
    simulation: activity.simulation
        ? {
              initialStateId: activity.simulation.initialStateId,
              debriefQuestion: activity.simulation.debriefQuestion,
              states: activity.simulation.states.map((state) => ({
                  id: state.id,
                  label: state.label,
                  observation: state.observation,
                  isSuccess: state.isSuccess,
              })),
              actions: activity.simulation.actions.map((action) => ({ id: action.id, label: action.label })),
              transitions: activity.simulation.transitions.map((transition) => ({
                  id: transition.id,
                  fromStateId: transition.fromStateId,
                  actionId: transition.actionId,
                  toStateId: transition.toStateId,
              })),
          }
        : null,
    exercise: activity.exercise
        ? {
              submissionInstructions: activity.exercise.submissionInstructions,
              files: (activity.exercise.files ?? []).map((file) => ({
                  relativePath: file.relativePath,
                  role: file.role,
                  syntaxLanguage: file.syntaxLanguage,
                  content: file.content,
              })),
          }
        : null,
})

const toSectionView = (section: LessonSection, isPremium: boolean): LessonSectionView => {
    const locked = section.phase !== LESSON_FREE_PHASE && !isPremium
    return {
        id: section.id,
        sortIndex: section.sortIndex,
        phase: section.phase,
        title: section.title,
        locked,
        body: locked ? null : section.body,
        activities: locked ? [] : (section.activities ?? []).map((activity) => toActivityView(activity)),
    }
}

const toWorkspaceView = (row: VersionRow, isPremium: boolean): LessonWorkspaceView | null => {
    const { workspace, files } = row.content
    if (!isPremium || workspace === null) return null
    return {
        runtime: workspace.runtime,
        commands: { windows: workspace.commands.windows ?? null, unix: workspace.commands.unix ?? null },
        files: files.map((file) => ({ path: file.path, role: file.role, content: file.content })),
    }
}

/**
 * The public projection of a stored lesson version: an explicit allowlist, so a field added to the stored content stays
 * private until it is listed here. A section outside the free phase keeps only its title while the learner lacks Premium.
 */
export const toLessonView = (row: VersionRow, locale: LessonLocale, isPremium: boolean): LessonView => {
    const document = row.content.locales[locale]
    return {
        id: row.lesson_id,
        version: row.version,
        locale,
        title: document.title,
        description: document.description,
        category: row.category,
        group: row.lesson_group,
        topic: { id: row.topic, title: row.topic_title },
        difficulty: row.difficulty,
        minutes: row.minutes_read,
        implementation: row.implementation,
        overview: document.body,
        learningOutcomes: document.learningOutcomes.map((outcome) => ({ id: outcome.id, text: outcome.text })),
        prerequisites: document.prerequisites.map((item) => ({ id: item.id, text: item.text })),
        references: document.references.map((reference) => ({
            id: reference.id,
            label: reference.label,
            url: reference.url ?? null,
            citation: reference.citation,
        })),
        isPremium,
        sections: document.sections.map((section) => toSectionView(section, isPremium)),
        workspace: toWorkspaceView(row, isPremium),
    }
}
