import { Injectable } from "@nestjs/common"
import type { EssentialPart } from "@modules/domain/entitlement"
import { LessonReadService, type LessonLocale, type LessonView } from "@modules/domain/lesson"
import { RelayDeviceService, RelayFeedService, type LearnerRunEvent } from "@modules/domain/relay"
import { McpError, McpErrorCode } from "./errors/mcp.error"
import { InjectMcpOptions } from "./mcp.decorators"
import type { McpOptions } from "./mcp.options"
import type {
    McpConnectInfo,
    McpFile,
    McpInvariant,
    McpRun,
    McpRunRequested,
    McpScenario,
    McpSearchResult,
} from "./mcp.contracts"
import { chunksOf } from "./mcp-embedding.policy"
import { keywordHitsOf, readablePathOf } from "./mcp-source.policy"
import { McpSourceService } from "./mcp-source.service"
import { McpHarnessService } from "./mcp-harness.service"
import { McpVectorIndex } from "./mcp-vector.index"

/** The most characters of log one run shows: its tail, where the failure is. */
const LOG_TAIL_MAX = 4000
/** The task id the learner CLI uploads a lesson's results under. */
const taskOf = (lessonId: string): string => `lesson:${lessonId}`
/** The command a learner runs for a scenario with guards off, the one the signed manifest carries. */
const scenarioCommandOf = (lessonId: string, scenarioId: string, guardsOff: ReadonlyArray<string>): string =>
    `starci-next run ${lessonId} --scenario ${scenarioId}${guardsOff.map((guard) => ` --guard ${guard}=off`).join("")}`
/** The most runs `my_runs` answers. */
const RUNS_MAX = 20

/** One section of a lesson as the learner's AI lists it; a locked one keeps its title and drops the body. */
export interface McpSectionOutline {
    /** The 1-based number `lesson://<id>/section/<n>` uses. */
    readonly n: number
    /** The section id. */
    readonly id: string
    /** The phase. */
    readonly phase: string
    /** The title. */
    readonly title: string
    /** True when Premium is needed to read it. */
    readonly locked: boolean
}

/** The outline of a lesson as the learner's AI reads it. */
export interface McpLessonOutline {
    /** The lesson id. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The description. */
    readonly description: string
    /** The learning outcomes. */
    readonly outcomes: ReadonlyArray<string>
    /** The sections in order, locked ones included without their text. */
    readonly sections: ReadonlyArray<McpSectionOutline>
    /** Whether the learner holds Premium (source, scenarios and runs need it). */
    readonly isPremium: boolean
}

/** One unlocked section with its text. */
export interface McpSection extends McpSectionOutline {
    /** The markdown body. */
    readonly body: string
}

@Injectable()
/**
 * What the learner's AI may read and do for one lesson, every call on behalf of one learner. Lesson text comes only from
 * `LessonReadService.find`, the same projection and gating the app serves (a locked section has no body; no answer key, expected
 * evidence or option correctness is in it). Source comes only from `McpSourceService`, scenarios and invariants only from its
 * public catalog, runs only from the learner's own relay events, and the one act is a scenario manifest the CLI confirms.
 */
export class McpTutorService {
    constructor(
        private readonly lessons: LessonReadService,
        private readonly source: McpSourceService,
        private readonly vectors: McpVectorIndex,
        private readonly harness: McpHarnessService,
        private readonly devices: RelayDeviceService,
        private readonly feed: RelayFeedService,
        @InjectMcpOptions() private readonly options: McpOptions,
    ) {}

    /** The endpoint and token limit the connect page shows. */
    connectInfo(): McpConnectInfo {
        return { endpoint: this.options.publicUrl ?? "/mcp", tokenLimit: this.options.tokenLimit }
    }

    /** The outline of a lesson; a lesson that is not live is not found. */
    async outline(learnerId: string, id: string, locale: LessonLocale): Promise<McpLessonOutline> {
        const view = await this.view(learnerId, id, locale)
        return {
            id: view.id,
            title: view.title,
            description: view.description,
            outcomes: view.learningOutcomes.map((outcome) => outcome.text),
            sections: view.sections.map((section, index) => ({
                n: index + 1,
                id: section.id,
                phase: section.phase,
                title: section.title,
                locked: section.locked,
            })),
            isPremium: view.isPremium,
        }
    }

    /** One section by its 1-based number; a locked one is MCP_PREMIUM_REQUIRED, never its text. */
    async section(learnerId: string, id: string, n: number, locale: LessonLocale): Promise<McpSection> {
        const view = await this.view(learnerId, id, locale)
        const section = view.sections[n - 1]
        if (section === undefined || section.locked || section.body === null)
            throw new McpError({ code: McpErrorCode.PremiumRequired })
        return { n, id: section.id, phase: section.phase, title: section.title, locked: false, body: section.body }
    }

    /** Lines of one file of the lesson repository at its pinned commit. */
    async readFile(learnerId: string, id: string, path: string, from?: number, to?: number): Promise<McpFile> {
        await this.requirePart(learnerId, id, "2-source")
        return this.source.read(id, path, from, to)
    }

    /** A search over the lesson repository: semantic when asked and available, keywords otherwise. */
    async searchCode(learnerId: string, id: string, query: string, semantic: boolean): Promise<McpSearchResult> {
        await this.requirePart(learnerId, id, "2-source")
        if (semantic && this.vectors.isConfigured) {
            const texts = await this.source.texts(id)
            const chunks = texts.flatMap((file) => chunksOf(file.path, file.text))
            const hits = await this.vectors.search(
                { scope: { kind: "code", sourceId: id, locale: "und" }, access: "premium", readable: ["premium"] },
                chunks,
                query,
            )
            if (hits !== null) return { mode: "semantic", fellBack: false, hits }
        }
        return { mode: "keyword", fellBack: semantic, hits: await this.source.keywordSearch(id, query) }
    }

    /** A search over the sections this learner may read now: only unlocked text is ever embedded or scanned. */
    async searchLesson(
        learnerId: string,
        id: string,
        locale: LessonLocale,
        query: string,
        semantic: boolean,
    ): Promise<McpSearchResult> {
        const view = await this.view(learnerId, id, locale)
        const unlocked = view.sections.flatMap((section, index) =>
            section.locked || section.body === null ? [] : [{ path: `section/${index + 1}`, text: section.body }],
        )
        if (semantic && this.vectors.isConfigured) {
            const chunks = unlocked.flatMap((section) => chunksOf(section.path, section.text))
            const hits = await this.vectors.search(
                {
                    scope: { kind: "lesson", sourceId: id, locale },
                    access: view.isPremium ? "premium" : "free",
                    readable: view.isPremium ? ["free", "premium"] : ["free"],
                },
                chunks,
                query,
            )
            if (hits !== null) return { mode: "semantic", fellBack: false, hits }
        }
        return { mode: "keyword", fellBack: semantic, hits: keywordHitsOf(unlocked, query) }
    }

    /** A search over the harness guides and docs: free to every learner with a token, no entitlement asked. */
    searchHarness(locale: LessonLocale, query: string, semantic: boolean): Promise<McpSearchResult> {
        return this.harness.search(locale, query, semantic)
    }

    /** The public scenarios of the lesson; a hidden scenario is not in the catalog at all. */
    async scenarios(learnerId: string, id: string): Promise<ReadonlyArray<McpScenario>> {
        await this.requirePart(learnerId, id, "3-scenarios")
        return (await this.source.catalog(id)).scenarios
    }

    /** The invariants this learner has revealed: open ones, and those whose scenario they have run. */
    async invariants(learnerId: string, id: string): Promise<ReadonlyArray<McpInvariant>> {
        await this.requirePart(learnerId, id, "3-scenarios")
        const catalog = await this.source.catalog(id)
        const ran = new Set(
            (await this.feed.runEvents(learnerId, taskOf(id)))
                .filter((event) => event.kind === "check.result")
                .map((event) => event.checkId),
        )
        return catalog.invariants
            .filter((invariant) => invariant.revealedBy === null || ran.has(invariant.revealedBy))
            .map(({ id: invariantId, name, statement, where }) => ({
                id: invariantId,
                name,
                statement,
                where: where !== null && readablePathOf(where.split(":")[0] ?? "") !== null ? where : null,
            }))
    }

    /** The learner's own recent runs of the lesson's public scenarios, newest first, with the CLI's log tail. */
    async myRuns(learnerId: string, id: string): Promise<ReadonlyArray<McpRun>> {
        await this.requirePart(learnerId, id, "3-scenarios")
        const known = new Set((await this.source.catalog(id)).scenarios.map((scenario) => scenario.id))
        const events = (await this.feed.runEvents(learnerId, taskOf(id))).filter((event) => known.has(event.checkId))
        const runs = new Map<string, Array<LearnerRunEvent>>()
        for (const event of events) runs.set(event.runId, [...(runs.get(event.runId) ?? []), event])
        return [...runs.entries()].slice(0, RUNS_MAX).map(([runId, items]) => this.runOf(runId, items))
    }

    /**
     * Sends a manifest for one public scenario to the learner's online device. The CLI shows the command and asks the learner
     * before it runs; the result comes back through `my_runs`. With no device listening nothing is sent and the answer carries the
     * exact command for the learner to run in their own terminal, which asks the same confirmation.
     */
    async requestRun(
        learnerId: string,
        id: string,
        scenarioId: string,
        guardsOff: ReadonlyArray<string>,
    ): Promise<McpRunRequested> {
        await this.requirePart(learnerId, id, "3-scenarios")
        const scenario = (await this.source.catalog(id)).scenarios.find((item) => item.id === scenarioId)
        if (scenario === undefined || !guardsOff.every((guard) => scenario.guards.includes(guard)))
            throw new McpError({ code: McpErrorCode.ScenarioUnknown })
        const command = scenarioCommandOf(id, scenarioId, guardsOff)
        const device = (await this.devices.devices(learnerId)).find((item) => item.online)
        if (device === undefined) return { delivered: false, device: null, command, manifestId: null }
        const manifest = await this.feed.scenarioManifest(
            { learnerId, deviceId: device.id },
            { lessonId: id, scenarioId, guardsOff },
        )
        return {
            delivered: true,
            device: device.name,
            command: manifest.body.checks[0]?.command ?? command,
            manifestId: manifest.body.manifestId,
        }
    }

    private view(learnerId: string, id: string, locale: LessonLocale): Promise<LessonView> {
        return this.lessons.find({ id, locale, learnerId })
    }

    /**
     * Refuses a part the learner may not read. A four-part lesson answers by part (the same entitlement setting the page and the
     * relay doors read: by default only Bản chất is free); a lesson without the four parts needs Premium as before.
     */
    private async requirePart(learnerId: string, id: string, part: EssentialPart): Promise<void> {
        const view = await this.view(learnerId, id, "vi")
        const locked = view.essential?.lockedParts
        const isOpen = locked === undefined ? view.isPremium : !locked.includes(part)
        if (!isOpen) throw new McpError({ code: McpErrorCode.PremiumRequired })
    }

    private runOf(runId: string, newestFirst: ReadonlyArray<LearnerRunEvent>): McpRun {
        const result = newestFirst.find((event) => event.kind === "check.result")
        const log = [...newestFirst]
            .reverse()
            .flatMap((event) => (event.kind === "log" && event.text !== null ? [event.text] : []))
            .join("\n")
        const first = newestFirst[0]
        return {
            runId,
            scenario: first?.checkId ?? "",
            passed: result?.passed ?? null,
            exitCode: result?.exitCode ?? null,
            commit: result?.commit ?? null,
            at: first?.at ?? "",
            log: log.length === 0 ? null : log.slice(-LOG_TAIL_MAX),
        }
    }
}
