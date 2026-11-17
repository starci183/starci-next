import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InjectHarnessOptions } from "./harness.decorators"
import type { HarnessOptions } from "./harness.options"
import { DEFAULT_CI_OIDC_AUDIENCE } from "@modules/domain/project"
import { HARNESS_MESSAGES } from "./messages/harness.messages"
import { HarnessError, HarnessErrorCode } from "./errors/harness.error"
import type {
    HarnessBuildSummaryView,
    HarnessBuildView,
    HarnessDocRecord,
    HarnessDocSummaryView,
    HarnessDocView,
    HarnessDoctorView,
    HarnessGuideRecord,
    HarnessGuideSummaryView,
    HarnessGuideView,
    HarnessPageView,
    HarnessHubView,
    HarnessLocale,
    HarnessProbeRecord,
    HarnessProofRow,
    HarnessRunRow,
    HarnessTool,
    HarnessTrapView,
} from "./harness.contracts"
import {
    buildViewOf,
    docViewOf,
    guideOfProbeMap,
    guideViewOf,
    hubOf,
    probeResultOf,
    trapViewOf,
    type StoredBuild,
    type StoredTrap,
} from "./harness-progress.policy"
import type { BindingRow, ContentRow, PackRow, ProofRow } from "./persistence/harness.rows"
import {
    SELECT_BINDINGS,
    SELECT_PACK,
    SELECT_PROOFS,
    SELECT_PUBLISHED_KIND,
    SELECT_PUBLISHED_ONE,
} from "./persistence/harness.sql"

/** A tarball of one live content item with its hash and the version it was cut at. */
export interface HarnessPack {
    /** The gzip tarball bytes. */
    readonly content: Buffer
    /** The lowercase hex SHA-256 of `content`. */
    readonly sha256: string
    /** The content version (the commit). */
    readonly commit: string
}

/** The stored record of a content row, read as the type the importer wrote under that kind. */
const recordOf = <T>(row: ContentRow): T => row.content as T

const summaryOf = (view: HarnessBuildView): HarnessBuildSummaryView => ({
    id: view.id,
    order: view.order,
    title: view.title,
    summary: view.summary,
    keys: view.keys,
    stageCount: view.stageCount,
    practisingStages: view.practisingStages,
    provedStages: view.provedStages,
    state: view.state,
})

@Injectable()
/**
 * The learner reads of /harness (free for everyone: no Premium question is asked anywhere here): the hub, the builds with the
 * state of each stage, the guides, the docs, the doctor and the trial. The relay owns the relayed results, so a caller hands them
 * in as rows; this service adds the attested proofs and the project bindings it owns. Hidden build files and trap hashes never
 * leave the pack door.
 */
export class HarnessReadService {
    private readonly audience: string

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectHarnessOptions() options: HarnessOptions,
    ) {
        this.audience = options.ciOidcAudience ?? DEFAULT_CI_OIDC_AUDIENCE
    }

    /** The three parts with the learner's counts. */
    async hub(
        learnerId: string,
        locale: HarnessLocale,
        buildRuns: ReadonlyArray<HarnessRunRow>,
        doctorRows: ReadonlyArray<HarnessRunRow>,
    ): Promise<HarnessHubView> {
        const [builds, guides, probes, docs] = await Promise.all([
            this.buildViews(learnerId, locale, buildRuns),
            this.records<HarnessGuideRecord>("guide"),
            this.records<HarnessProbeRecord>("probe"),
            this.records<HarnessDocRecord>("doc"),
        ])
        return {
            parts: hubOf({
                builds,
                guides,
                probes,
                doctorRows,
                docs,
                words: (key) => HARNESS_MESSAGES[locale][key] ?? key,
            }),
        }
    }

    /** Every live build with the learner's stage states. */
    async builds(
        learnerId: string,
        locale: HarnessLocale,
        buildRuns: ReadonlyArray<HarnessRunRow>,
    ): Promise<ReadonlyArray<HarnessBuildSummaryView>> {
        return (await this.buildViews(learnerId, locale, buildRuns)).map((view) => summaryOf(view))
    }

    /** One build with its stages and steps; an unknown id is HARNESS_NOT_FOUND. */
    async build(
        learnerId: string,
        locale: HarnessLocale,
        id: string,
        buildRuns: ReadonlyArray<HarnessRunRow>,
    ): Promise<HarnessBuildView> {
        const view = (await this.buildViews(learnerId, locale, buildRuns)).find((each) => each.id === id)
        if (view === undefined) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        return view
    }

    /** The guides of one tool in order. */
    async guides(tool: HarnessTool, locale: HarnessLocale): Promise<ReadonlyArray<HarnessGuideSummaryView>> {
        return (await this.records<HarnessGuideRecord>("guide"))
            .filter((guide) => guide.tool === tool)
            .map((guide) => ({
                tool: guide.tool,
                slug: guide.slug,
                order: guide.order,
                title: guide.title[locale],
                summary: guide.summary[locale],
                minutes: guide.minutes,
            }))
    }

    /** One guide with its sections and the learner's results of its probes. */
    async guide(
        tool: HarnessTool,
        slug: string,
        locale: HarnessLocale,
        doctorRows: ReadonlyArray<HarnessRunRow>,
    ): Promise<HarnessGuideView> {
        const row = await this.one("guide", `${tool}/${slug}`)
        const probes = (await this.records<HarnessProbeRecord>("probe")).filter((probe) => probe.tool === tool)
        return guideViewOf(recordOf<HarnessGuideRecord>(row), probes, locale, doctorRows)
    }

    /** The docs in order. */
    async docs(locale: HarnessLocale): Promise<ReadonlyArray<HarnessDocSummaryView>> {
        return (await this.records<HarnessDocRecord>("doc")).map((doc) => ({
            slug: doc.slug,
            order: doc.order,
            title: doc.title[locale],
            summary: doc.summary[locale],
            minutes: doc.minutes,
        }))
    }

    /** One doc with its sections. */
    async doc(slug: string, locale: HarnessLocale): Promise<HarnessDocView> {
        return docViewOf(recordOf<HarnessDocRecord>(await this.one("doc", slug)), locale)
    }

    /**
     * Every live guide and doc as text pages in one locale, in order. It reads only the kinds `guide` and `doc` and builds no probe
     * result, so a build kit, a hidden part, a doctor probe or a trial trap is never in it (the AI search reads this).
     */
    async pages(locale: HarnessLocale): Promise<ReadonlyArray<HarnessPageView>> {
        const guides = (await this.records<HarnessGuideRecord>("guide")).map((guide): HarnessPageView => {
            const view = guideViewOf(guide, [], locale, [])
            return {
                kind: "guide",
                tool: guide.tool,
                slug: guide.slug,
                title: view.title,
                summary: view.summary,
                sections: view.sections,
            }
        })
        const docs = (await this.records<HarnessDocRecord>("doc")).map((doc): HarnessPageView => {
            const view = docViewOf(doc, locale)
            return {
                kind: "doc",
                tool: null,
                slug: doc.slug,
                title: view.title,
                summary: view.summary,
                sections: view.sections,
            }
        })
        return [...guides, ...docs]
    }

    /** The probes of one tool with the learner's newest result of each. */
    async doctor(
        tool: HarnessTool,
        locale: HarnessLocale,
        doctorRows: ReadonlyArray<HarnessRunRow>,
    ): Promise<HarnessDoctorView> {
        const [probes, guides] = await Promise.all([
            this.records<HarnessProbeRecord>("probe"),
            this.records<HarnessGuideRecord>("guide"),
        ])
        const guideOf = guideOfProbeMap(guides)
        const views = probes
            .filter((probe) => probe.tool === tool)
            .map((probe) => probeResultOf(probe, guideOf.get(`${tool}/${probe.id}`) ?? null, locale, doctorRows))
        return {
            tool,
            probes: views,
            passed: views.filter((view) => view.status === "passed").length,
            total: views.length,
        }
    }

    /** The traps, for one tool or all, with the learner's newest trial result. */
    async trials(
        locale: HarnessLocale,
        tool: HarnessTool | null,
        trialRows: ReadonlyArray<HarnessRunRow>,
    ): Promise<ReadonlyArray<HarnessTrapView>> {
        return (await this.records<StoredTrap>("trap"))
            .filter((trap) => tool === null || trap.tools.includes(tool))
            .map((trap) => trapViewOf(trap, locale, tool, trialRows))
    }

    /** The stored build records, for the manifest and the proof. */
    storedBuilds(): Promise<ReadonlyArray<StoredBuild>> {
        return this.records<StoredBuild>("build")
    }

    /** The stored trap of an id, for the manifest; an unknown id is HARNESS_NOT_FOUND. */
    async trap(id: string): Promise<StoredTrap> {
        return recordOf<StoredTrap>(await this.one("trap", id))
    }

    /** The live pack of a build, a trap or a doctor tool; none is HARNESS_NOT_FOUND. */
    async pack(kind: "build" | "trap" | "doctor-pack", key: string): Promise<HarnessPack> {
        const rows: Array<PackRow> = await this.entityManager.query(SELECT_PACK, [kind, key])
        const row = rows[0]
        if (row === undefined) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        return { content: row.pack, sha256: row.pack_sha256, commit: row.version }
    }

    /** The attested results of a learner, newest per e2e. */
    async proofs(learnerId: string): Promise<ReadonlyArray<HarnessProofRow>> {
        const rows: Array<ProofRow> = await this.entityManager.query(SELECT_PROOFS, [learnerId, LIST_ROWS_MAX])
        return rows.map((row) => ({
            buildId: row.build_id,
            stageId: row.stage_id,
            e2eId: row.e2e_id,
            passed: row.passed,
            runId: row.run_id,
            commit: row.commit_sha,
            at: row.recorded_at,
        }))
    }

    private bindingOf(
        bindings: ReadonlyArray<BindingRow>,
        buildId: string,
    ): { readonly repository: string; readonly bindingId: string } | null {
        const found = bindings.find((binding) => binding.build_id === buildId)
        return found === undefined ? null : { repository: found.repository, bindingId: found.binding_id }
    }

    private async buildViews(
        learnerId: string,
        locale: HarnessLocale,
        buildRuns: ReadonlyArray<HarnessRunRow>,
    ): Promise<ReadonlyArray<HarnessBuildView>> {
        const [builds, proofs, bindings] = await Promise.all([
            this.records<StoredBuild>("build"),
            this.proofs(learnerId),
            this.entityManager.query(SELECT_BINDINGS, [learnerId]) as Promise<Array<BindingRow>>,
        ])
        return builds.map((build) =>
            buildViewOf(
                build,
                locale,
                buildRuns.filter((row) => row.taskId === `harness:build:${build.id}`),
                proofs,
                this.bindingOf(bindings, build.id),
                this.audience,
            ),
        )
    }

    private async records<T>(kind: string): Promise<ReadonlyArray<T>> {
        const rows: Array<ContentRow> = await this.entityManager.query(SELECT_PUBLISHED_KIND, [kind, LIST_ROWS_MAX])
        return rows.map((row) => recordOf<T>(row))
    }

    private async one(kind: string, key: string): Promise<ContentRow> {
        const rows: Array<ContentRow> = await this.entityManager.query(SELECT_PUBLISHED_ONE, [kind, key])
        const row = rows[0]
        if (row === undefined) throw new HarnessError({ code: HarnessErrorCode.NotFound })
        return row
    }
}
