import {
    DEFAULT_ESSENTIAL_FREE_PARTS,
    ESSENTIAL_PARTS,
    openEssentialPartsOf,
    type EssentialPart,
} from "@modules/domain/entitlement"
import type { CatalogRow, VersionRow } from "./persistence/lesson.rows"
import type { LessonActivity, LessonLocale, LessonLocaleDocument, LessonSection } from "./lesson.contracts"
import { needsPremium, premiumMarkOf } from "./lesson-access.policy"
import { toEssentialView } from "./lesson-essential-view.mapper"
import { LESSON_ESSENCE_SECTION } from "./lesson-essential.contracts"
import type {
    LessonActivityView,
    LessonCatalogItemView,
    LessonSectionView,
    LessonView,
    LessonWorkspaceVariantView,
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
                  facts: (state.facts ?? []).map((fact) => ({ label: fact.label, value: fact.value })),
              })),
              actions: activity.simulation.actions.map((action) => ({
                  id: action.id,
                  label: action.label,
                  isBranch: action.isBranch === true,
              })),
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

/** The part a section that is not named after its part is read under: the Bản chất reading (`2-essence`) is the `2-source` part. */
const SECTION_PARTS: Readonly<Record<string, EssentialPart>> = { [LESSON_ESSENCE_SECTION]: "2-source" }

/** The Essentials part a section id is read under, or undefined for a section of no part. */
export const essentialPartOfSection = (id: string): EssentialPart | undefined =>
    SECTION_PARTS[id] ?? ESSENTIAL_PARTS.find((part) => part === id)

/** The Essentials part a section of a four-part lesson is, or undefined for any other section. */
const essentialPartOf = (section: LessonSection, document: LessonLocaleDocument): EssentialPart | undefined =>
    document.essential === undefined ? undefined : essentialPartOfSection(section.id)

const toSectionView = (
    section: LessonSection,
    document: LessonLocaleDocument,
    isPremium: boolean,
    open: ReadonlyArray<EssentialPart>,
): LessonSectionView => {
    // A four-part lesson locks its part sections by the entitlement setting of free parts, not by the teacher's mark.
    const part = essentialPartOf(section, document)
    const locked =
        part === undefined
            ? needsPremium(section.phase, premiumMarkOf(section, document)) && !isPremium
            : !open.includes(part)
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

const toWorkspaceVariants = (row: VersionRow, isPremium: boolean): ReadonlyArray<LessonWorkspaceVariantView> =>
    isPremium
        ? (row.content.workspaces ?? []).map((variant) => ({
              language: variant.language,
              runtime: variant.runtime,
              commands: { windows: variant.commands.windows ?? null, unix: variant.commands.unix ?? null },
              files: variant.files.map((file) => ({ path: file.path, role: file.role, content: file.content })),
          }))
        : []

/**
 * The public projection of a stored lesson version: an explicit allowlist, so a field added to the stored content stays
 * private until it is listed here. A section outside the free phase keeps only its title while the learner lacks Premium. A
 * four-part lesson opens by part: `open` lists the parts the learner may read (default: all with Premium, Bản chất without).
 */
export const toLessonView = (
    row: VersionRow,
    locale: LessonLocale,
    isPremium: boolean,
    open: ReadonlyArray<EssentialPart> = openEssentialPartsOf(DEFAULT_ESSENTIAL_FREE_PARTS, isPremium),
): LessonView => {
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
        sections: document.sections.map((section) => toSectionView(section, document, isPremium, open)),
        workspace: toWorkspaceView(row, isPremium),
        workspaces: toWorkspaceVariants(row, isPremium),
        essential: toEssentialView(document.essential, open),
    }
}
