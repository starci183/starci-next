import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_PUBLISHED } from "./persistence/lesson.sql"
import { sourceArchiveOf, type LessonSourceArchive, type LessonSourceCode } from "./lesson-source-archive.policy"
import type { LessonSourceTree } from "./lesson-source-tree.contracts"
import { lessonSourceTreeOf } from "./lesson-source-tree.policy"

/** How many tarballs stay cached in one process (a lesson version's source is a few hundred KiB). */
const ARCHIVE_CACHE_MAX = 64

/** The most matches one search answers. */
const SEARCH_MAX = 200

/** One file read from a lesson's source tree. */
export interface LessonSourceRead {
    readonly lessonId: string
    readonly commit: string
    readonly path: string
    readonly content: string
}

/** One line of a lesson's source that matches a search. */
export interface LessonSourceMatch {
    readonly path: string
    /** The line number, from 1. */
    readonly line: number
    readonly text: string
}

/** The tarball of a lesson's source with the commit it was cut at. */
export interface LessonSourcePack extends LessonSourceArchive {
    readonly lessonId: string
    readonly commit: string
}

@Injectable()
/**
 * The one read of a lesson's source tree (the lesson folder's `source/` in the content repository, at the content commit the
 * live version was imported at): the tree (the MCP's `McpSourceTree` adapter), one file, a text search and the deterministic
 * tarball. The relay's `source.tgz` door and the MCP read through it, so both see the same bytes. It holds only `source/`: `hidden/` is never
 * stored in it. Who may read is the caller's question (Premium, through `LessonContentService.requireAccess`); a lesson that is
 * not live or ships no source is not found. No path or commit the learner supplies selects anything but a file of this tree.
 */
export class LessonSourceService {
    /** The tarballs cut so far, by `<lesson>@<commit>`: a version is immutable, so its bytes never change. */
    private readonly archives = new Map<string, LessonSourceArchive>()

    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /**
     * The source tree of the live version for the MCP (`McpSourceTree`): the files with their text, the scenarios (id, title,
     * fault, invariant, guard names) and the invariants with where the code walk places them, at the content commit; null when
     * the lesson is not live or ships no source. No hidden scenario, challenge, rubric, expected output or hint is in it.
     */
    async tree(lessonId: string): Promise<LessonSourceTree | null> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        return row === undefined ? null : lessonSourceTreeOf(row.version, row.content)
    }

    /** One file of the lesson's source, by its path in the tree; not found for any other path. */
    async read(lessonId: string, path: string): Promise<LessonSourceRead> {
        const { row, code } = await this.live(lessonId)
        const file = code.find((each) => each.path === path)
        if (file === undefined) throw new LessonError({ code: LessonErrorCode.NotFound })
        return { lessonId, commit: row.version, path: file.path, content: file.content }
    }

    /** The lines of the lesson's source that hold the text (case-insensitive), in path and line order, 200 at most. */
    async search(lessonId: string, text: string): Promise<ReadonlyArray<LessonSourceMatch>> {
        const needle = text.trim().toLowerCase()
        if (needle === "") return []
        const { code } = await this.live(lessonId)
        return code
            .flatMap((file) =>
                file.content
                    .split("\n")
                    .map((line, index) => ({ path: file.path, line: index + 1, text: line }))
                    .filter((match) => match.text.toLowerCase().includes(needle)),
            )
            .slice(0, SEARCH_MAX)
    }

    /** The tarball of the lesson's source, cut once per lesson and commit; null when the live version ships no source. */
    async archive(lessonId: string): Promise<LessonSourcePack | null> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        if (row === undefined) return null
        const archive = this.archiveOf(row)
        return archive === null ? null : { ...archive, lessonId, commit: row.version }
    }

    /** The tarball of the lesson's Tìm sạn bug pack (`bugs/source/`), cut once per lesson and commit; null when it ships none. */
    async bugsArchive(lessonId: string): Promise<LessonSourcePack | null> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        if (row === undefined) return null
        const archive = this.bugsArchiveOf(row)
        return archive === null ? null : { ...archive, lessonId, commit: row.version }
    }

    /** The tarball of a stored version's bug pack, cut once per lesson and version; null when it ships no `bugs/source/`. */
    bugsArchiveOf(row: VersionRow): LessonSourceArchive | null {
        return this.cut(`${row.lesson_id}@${row.version}#bugs`, row.content.bugsCode ?? [])
    }

    /** The tarball of a stored version, cut once per lesson and version; null when it ships no `source/`. */
    archiveOf(row: VersionRow): LessonSourceArchive | null {
        return this.cut(`${row.lesson_id}@${row.version}`, row.content.sourceCode ?? [])
    }

    /** The tarball of some files under a cache key, cut once; null for no file. */
    private cut(key: string, code: ReadonlyArray<LessonSourceCode>): LessonSourceArchive | null {
        if (code.length === 0) return null
        const cached = this.archives.get(key)
        if (cached !== undefined) return cached
        const archive = sourceArchiveOf(code)
        if (this.archives.size >= ARCHIVE_CACHE_MAX) this.archives.clear()
        this.archives.set(key, archive)
        return archive
    }

    /** The live version and its source files; not found when it is not live or ships none. */
    private async live(
        lessonId: string,
    ): Promise<{ readonly row: VersionRow; readonly code: ReadonlyArray<LessonSourceCode> }> {
        const rows: Array<VersionRow> = await this.entityManager.query(SELECT_PUBLISHED, [lessonId])
        const row = rows[0]
        const code = row?.content.sourceCode ?? []
        if (row === undefined || code.length === 0) throw new LessonError({ code: LessonErrorCode.NotFound })
        return { row, code }
    }
}
