import { join } from "node:path"
import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { eachInOrder } from "@modules/platform/primitives"
import { InterviewImportService } from "@modules/domain/interview"
import { LessonImportService } from "@modules/domain/lesson"
import { PracticeImportService } from "@modules/domain/practice"
import { ReviewImportService } from "@modules/domain/review"
import type {
    ActiveSnapshots,
    ContentKind,
    ContentGitConfig,
    ContentKindReport,
    ContentSnapshot,
    ContentSourceConfig,
    ContentSourceId,
    SyncContentParams,
} from "./content.contracts"
import { InjectContentOptions } from "./content.decorators"
import { ContentLogEvent } from "./content.log-events"
import type { ContentOptions } from "./content.options"
import { InjectContentDisk, type ContentDiskReader } from "./content-disk.port"
import { InjectContentGit, type ContentGitReader } from "./content-git.port"
import { catalogFilesOf, catalogKindsOf, manifestOf } from "./content-manifest.policy"
import { ContentError, ContentErrorCode } from "./errors/content.error"

/** The kinds in the order a sync runs them. */
export const CONTENT_KINDS: ReadonlyArray<ContentKind> = ["lessons", "interview", "review", "practice", "catalogs"]

/** The names a caller may pass to run only some kinds. */
const KIND_NAMES: ReadonlyArray<string> = CONTENT_KINDS

/** The length of the sha prefix used as a version label: the label of the dev seeds. */
const LABEL_LENGTH = 9

/** One repository ready on disk with the version label its imports use. */
interface Root {
    readonly directory: string
    readonly ref: string
    readonly snapshot: ContentSnapshot | null
}

/** A code-shaped failure text: an error code is kept as it is, anything else is reported as unexpected. */
const failureOf = (cause: unknown): string =>
    cause instanceof Error && /^[A-Z][A-Z_]{2,}$/u.test(cause.message) ? cause.message : "UNEXPECTED"

/** The configuration of one repository of the git mount, or null when the mount does not declare it. */
const sourceConfigOf = (git: ContentGitConfig, source: ContentSourceId): ContentSourceConfig | null =>
    source === "content" ? git.content : git.data

@Injectable()
/**
 * The gitmount: pulls the content repository (and the teacher's data repository) into versioned snapshots, or takes local
 * checkouts, then runs each importer at that version and records the catalogs. A kind that fails leaves its live version as it
 * was and does not stop the others; afterwards any failure fails the call. Each kind logs one line (counts and versions, never
 * content), and a pull logs the repository, sha and whether it was new, never a token.
 */
export class ContentSyncService {
    constructor(
        @InjectContentOptions() private readonly options: ContentOptions,
        @InjectContentGit() private readonly git: ContentGitReader,
        @InjectContentDisk() private readonly disk: ContentDiskReader,
        @InjectClock() private readonly clock: Clock,
        @InjectLogger() private readonly logger: Logger,
        private readonly lessons: LessonImportService,
        private readonly interviews: InterviewImportService,
        private readonly reviews: ReviewImportService,
        private readonly practice: PracticeImportService,
    ) {}

    /** Runs the sync and returns one report per kind it ran. */
    async sync(params: SyncContentParams): Promise<ReadonlyArray<ContentKindReport>> {
        const kinds = this.kindsOf(params.only)
        const content = await this.rootOf("content", params.contentDir)
        if (content === null)
            throw new ContentError({ code: ContentErrorCode.SyncRejected, params: { source: "content" } })
        const data = await this.rootOf("data", params.dataDir)
        const reports: Array<ContentKindReport> = []
        await eachInOrder(kinds, async (kind) => {
            const report = await this.run(kind, content, data)
            this.logger.info(ContentLogEvent.Synced, { ...report })
            reports.push(report)
        })
        const failed = reports.filter((report) => report.status === "failed")
        if (failed.length > 0) {
            throw new ContentError({
                code: ContentErrorCode.SyncFailed,
                params: { kinds: failed.map((report) => report.kind).join(", ") },
            })
        }
        await this.recordActive(content, data)
        return reports
    }

    private kindsOf(only: string): ReadonlyArray<ContentKind> {
        const wanted = only.split(",").filter((name) => name !== "")
        const unknown = wanted.filter((name) => !KIND_NAMES.includes(name))
        if (unknown.length > 0) {
            throw new ContentError({ code: ContentErrorCode.SyncRejected, params: { kinds: unknown.join(", ") } })
        }
        return wanted.length === 0 ? CONTENT_KINDS : CONTENT_KINDS.filter((kind) => wanted.includes(kind))
    }

    /** A local directory when one is given, else the git mount of the environment, else nothing. */
    private async rootOf(source: ContentSourceId, local: string | undefined): Promise<Root | null> {
        if (local !== undefined) {
            if (!(await this.disk.exists(local))) {
                throw new ContentError({ code: ContentErrorCode.SyncRejected, params: { source, directory: local } })
            }
            return { directory: local, ref: await this.git.fingerprint(local), snapshot: null }
        }
        const git = this.options.git
        const config = git === null ? null : sourceConfigOf(git, source)
        if (git === null || config === null) return null
        const pulled = await this.git.materialize({
            source,
            config,
            datasourcesDir: git.datasourcesDir,
            now: this.clock.now().toISOString(),
        })
        this.logger.info(ContentLogEvent.Pulled, {
            source,
            sha: pulled.snapshot.sha,
            created: pulled.created,
        })
        return {
            directory: pulled.snapshot.directory,
            ref: pulled.snapshot.sha.slice(0, LABEL_LENGTH),
            snapshot: pulled.snapshot,
        }
    }

    private async run(kind: ContentKind, content: Root, data: Root | null): Promise<ContentKindReport> {
        try {
            return await this.import(kind, content, data)
        } catch (cause) {
            const detail = failureOf(cause)
            this.logger.error(ContentLogEvent.Synced, cause, { kind, status: "failed", detail })
            return { kind, status: "failed", version: "", detail }
        }
    }

    private import(kind: ContentKind, content: Root, data: Root | null): Promise<ContentKindReport> {
        if (kind === "lessons") return this.importLessons(content, data)
        if (kind === "interview") return this.importInterview(content, data)
        if (kind === "review") return this.importReview(data)
        if (kind === "practice") return this.importPractice(content, data)
        return this.recordCatalogs(content)
    }

    private async importLessons(content: Root, data: Root | null): Promise<ContentKindReport> {
        const roots = [
            ...(data === null ? [] : [{ directory: join(data.directory, "concepts"), ref: data.ref }]),
            { directory: join(content.directory, "essentials"), ref: content.ref },
        ]
        const imported: Array<string> = []
        await eachInOrder(roots, async (root) => {
            if ((await this.disk.folders(root.directory)).length === 0) return
            await this.lessons.import({ directory: root.directory, ref: root.ref, only: "" })
            imported.push(root.ref)
        })
        if (imported.length === 0)
            return { kind: "lessons", status: "skipped", version: "", detail: "no essentials folder" }
        return {
            kind: "lessons",
            status: "imported",
            version: imported.join("+"),
            detail: `${imported.length} source(s)`,
        }
    }

    private async importInterview(content: Root, data: Root | null): Promise<ContentKindReport> {
        const overlay = join(content.directory, "interview", "overlay")
        const hasOverlay = (await this.disk.folders(join(overlay, "courses"))).length > 0
        if (data === null && !hasOverlay) {
            return { kind: "interview", status: "skipped", version: "", detail: "no data checkout and no overlay" }
        }
        if (data === null) {
            await this.interviews.import({ directory: overlay, ref: content.ref, only: "" })
            return { kind: "interview", status: "imported", version: content.ref, detail: "overlay only" }
        }
        const ref = hasOverlay ? `${data.ref}+${content.ref}` : data.ref
        await this.interviews.import({
            directory: data.directory,
            ref,
            only: "",
            ...(hasOverlay ? { overlay } : {}),
        })
        return {
            kind: "interview",
            status: "imported",
            version: ref,
            detail: hasOverlay ? "with overlay" : "data only",
        }
    }

    private async importReview(data: Root | null): Promise<ContentKindReport> {
        if (data === null) return { kind: "review", status: "skipped", version: "", detail: "no data checkout" }
        await this.reviews.import({ directory: data.directory, ref: data.ref, only: "" })
        return { kind: "review", status: "imported", version: data.ref, detail: "decks" }
    }

    private async importPractice(content: Root, data: Root | null): Promise<ContentKindReport> {
        const roots = [
            ...(data === null ? [] : [{ directory: join(data.directory, "coding-problems"), ref: data.ref }]),
            { directory: join(content.directory, "practice"), ref: content.ref },
        ]
        const imported: Array<string> = []
        await eachInOrder(roots, async (root) => {
            if ((await this.disk.folders(join(root.directory, "sets"))).length === 0) return
            await this.practice.import({ directory: root.directory, ref: root.ref, only: "" })
            imported.push(root.ref)
        })
        if (imported.length === 0) return { kind: "practice", status: "skipped", version: "", detail: "no sets folder" }
        return {
            kind: "practice",
            status: "imported",
            version: imported.join("+"),
            detail: `${imported.length} source(s)`,
        }
    }

    /** The catalogs have no importer yet: the manifest is checked and the files each catalog kind holds are counted. */
    private async recordCatalogs(content: Root): Promise<ContentKindReport> {
        const manifest = manifestOf(await this.disk.text(join(content.directory, "manifest.yaml")))
        const files = await this.disk.files(content.directory)
        const counts = catalogKindsOf(manifest).map((kind) => `${kind.id}=${catalogFilesOf(kind, files).length}`)
        return { kind: "catalogs", status: "imported", version: content.ref, detail: counts.join(" ") }
    }

    private async recordActive(content: Root, data: Root | null): Promise<void> {
        const git = this.options.git
        if (git === null || content.snapshot === null) return
        const active: ActiveSnapshots = {
            schema: "starci-next/datasource-active@1",
            content: { sha: content.snapshot.sha, directory: content.snapshot.directory },
            data: data?.snapshot == null ? null : { sha: data.snapshot.sha, directory: data.snapshot.directory },
            syncedAt: this.clock.now().toISOString(),
        }
        await this.disk.writeJson(join(git.datasourcesDir, "active.json"), active)
    }
}
