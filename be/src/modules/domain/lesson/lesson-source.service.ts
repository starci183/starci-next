import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { LessonError, LessonErrorCode } from "./errors/lesson.error"
import type { VersionRow } from "./persistence/lesson.rows"
import { SELECT_PUBLISHED } from "./persistence/lesson.sql"
import { sourceArchiveOf, type LessonSourceArchive, type LessonSourceCode } from "./lesson-source-archive.policy"

/** How many tarballs stay cached in one process (a lesson version's source is a few hundred KiB). */
const ARCHIVE_CACHE_MAX = 64

/** The most matches one search answers. */
const SEARCH_MAX = 200

/** One file of a lesson's source tree. */
export interface LessonSourceEntry {
    /** The path relative to the source root (`typescript/src/outbox.ts`). */
    readonly path: string
    /** Its size in bytes (UTF-8). */
    readonly bytes: number
}

/** The source tree of the live version of a lesson, at the content commit it was imported at. */
export interface LessonSourceTree {
    /** The lesson slug. */
    readonly lessonId: string
    /** The pinned content commit (the version). */
    readonly commit: string
    /** Every file, sorted by path. */
    readonly files: ReadonlyArray<LessonSourceEntry>
}

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
 * live version was imported at): the file list, one file, a text search and the deterministic tarball. The relay's
 * `source.tgz` door and the MCP read through it, so both see the same bytes. It holds only `source/`: `hidden/` is never
 * stored in it. Who may read is the caller's question (Premium, through `LessonContentService.requireAccess`); a lesson that is
 * not live or ships no source is not found. No path or commit the learner supplies selects anything but a file of this tree.
 */
export class LessonSourceService {
    /** The tarballs cut so far, by `<lesson>@<commit>`: a version is immutable, so its bytes never change. */
    private readonly archives = new Map<string, LessonSourceArchive>()

    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The file list of the lesson's source. */
    async tree(lessonId: string): Promise<LessonSourceTree> {
        const { row, code } = await this.live(lessonId)
        return {
            lessonId,
            commit: row.version,
            files: code.map((file) => ({ path: file.path, bytes: Buffer.byteLength(file.content) })),
        }
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

    /** The tarball of a stored version, cut once per lesson and version; null when it ships no `source/`. */
    archiveOf(row: VersionRow): LessonSourceArchive | null {
        const code = row.content.sourceCode ?? []
        if (code.length === 0) return null
        const key = `${row.lesson_id}@${row.version}`
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
