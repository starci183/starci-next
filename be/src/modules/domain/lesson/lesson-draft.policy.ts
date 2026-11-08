import { createHash } from "node:crypto"
import { groupOf } from "./lesson-group.policy"
import { resolveTopic, sourceKeyOf } from "./lesson-topic.policy"
import { readLessonSource } from "./lesson-source.policy"
import { validateLesson } from "./lesson-validation.policy"
import type { LessonTopicCatalog } from "./lesson-topic.contracts"
import type {
    LessonContent,
    LessonLocaleDocument,
    LessonWorkspaceDeclaration,
    LessonWorkspaceFile,
} from "./lesson.contracts"
import type { LessonDraftResult, LessonIssue, LessonParsedLocale, LessonSourceFile } from "./lesson-import.contracts"

/** The lesson id of a concept folder: its name without the numeric order prefix (`2-cqrs-read-models` is `cqrs-read-models`). */
export const lessonIdOf = (folder: string): string => folder.replace(/^\d+-/u, "")

/** The SHA-256 over the sorted `path`, `hash` lines of every source file: one value for the bytes of the whole folder. */
export const contentHashOf = (files: ReadonlyArray<LessonSourceFile>): string =>
    createHash("sha256")
        .update(
            [...files]
                .sort((a, b) => a.path.localeCompare(b.path))
                .map((file) => `${file.path}\u0000${file.sha256}\n`)
                .join(""),
        )
        .digest("hex")

const documentOf = (parsed: LessonParsedLocale): LessonLocaleDocument => ({
    title: parsed.root.title,
    description: parsed.root.description,
    body: parsed.root.body,
    learningOutcomes: parsed.root.learningOutcomes,
    prerequisites: parsed.root.prerequisites,
    references: parsed.root.references,
    retrieval: parsed.root.activities ?? [],
    sections: parsed.sections,
})

/** The workspace files found in the folder and the issues for those the concept declares but the folder lacks. */
interface WorkspaceAttachment {
    readonly files: Array<LessonWorkspaceFile>
    readonly issues: Array<LessonIssue>
}

const workspaceFiles = (
    declaration: LessonWorkspaceDeclaration | null,
    byPath: ReadonlyMap<string, LessonSourceFile>,
): WorkspaceAttachment => {
    const files: Array<LessonWorkspaceFile> = []
    const issues: Array<LessonIssue> = []
    ;(declaration?.files ?? []).forEach((entry, index) => {
        const source = byPath.get(entry.path)
        if (source === undefined) {
            issues.push({
                path: "vi.md",
                field: `workspace.files[${index}].path`,
                message: `${entry.path} is not in the folder`,
            })
        } else files.push({ ...entry, content: source.text })
    })
    return { files, issues }
}

/**
 * Turns the files of one concept folder into a draft ready to store, or answers the issues that block it. Nothing is stored
 * and no answer is printed here; the draft keeps the raw hash of every file and one hash for the whole folder.
 */
export const buildLessonDraft = (
    folder: string,
    files: ReadonlyArray<LessonSourceFile>,
    catalog: LessonTopicCatalog,
): LessonDraftResult => {
    const source = readLessonSource(files)
    if (source.parsed === null) return { draft: null, issues: source.issues }
    const { vi, en } = source.parsed
    const workspace = vi.root.workspace ?? null
    const attached = workspaceFiles(workspace, new Map(files.map((file) => [file.path, file])))
    const id = lessonIdOf(folder)
    const group = groupOf(id, vi.root.category)
    const placed = resolveTopic(id, catalog)
    const issues = [
        ...validateLesson(source.parsed),
        ...attached.issues,
        ...(group === null
            ? [
                  {
                      path: "vi.md",
                      field: "category",
                      message: `lesson ${id} of category ${vi.root.category} has no group entry`,
                  },
              ]
            : []),
        ...(placed.issue === null ? [] : [{ path: "vi.md", field: "topic", message: placed.issue }]),
    ]
    if (group === null || placed.topic === null || placed.source === null || issues.length > 0)
        return { draft: null, issues }
    const content: LessonContent = {
        locales: { vi: documentOf(vi), en: documentOf(en) },
        workspace,
        files: attached.files,
    }
    return {
        draft: {
            id,
            category: vi.root.category,
            group,
            topic: placed.topic,
            topicSource: placed.source,
            sourceKey: catalog.sources[id] ?? sourceKeyOf(vi.root.references),
            difficulty: vi.root.difficulty,
            minutesRead: vi.root.minutesRead,
            implementation: vi.root.implementation,
            sortIndex: vi.root.sortIndex,
            content,
            sourceHashes: Object.fromEntries(
                [...files]
                    .sort((a, b) => a.path.localeCompare(b.path))
                    .map((file): [string, string] => [file.path, file.sha256]),
            ),
            contentHash: contentHashOf(files),
        },
        issues: [],
    }
}
