import { LESSON_WORKSPACE_LANGUAGES, type LessonWorkspaceVariant } from "./lesson.contracts"
import type { VersionRow } from "./persistence/lesson.rows"

/**
 * The workspace of one language of a stored version: the one of `workspaces` with that language, or, for a version stored before
 * the languages existed, the single workspace when the lesson's implementation language is the one asked. Null when there is none.
 */
export const workspaceVariantOf = (row: VersionRow, language: string): LessonWorkspaceVariant | null => {
    const { workspace, files, workspaces } = row.content
    const found = (workspaces ?? []).find((variant) => variant.language === language)
    if (found) return found
    const known = LESSON_WORKSPACE_LANGUAGES.find((candidate) => candidate === language)
    if (workspace === null || (workspaces ?? []).length > 0 || row.implementation !== language || known === undefined)
        return null
    return { ...workspace, language: known, files }
}
