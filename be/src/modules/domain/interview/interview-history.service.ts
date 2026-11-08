import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type {
    EvidenceItem,
    HistoryView,
    InterviewTier,
    ReadinessPillar,
    ReadinessView,
    TrackFilter,
} from "./interview.contracts"
import { toEvidenceItem, toHistoryItem, toTrends } from "./interview-session.mapper"
import type { EvidenceRow, HistoryRow } from "./persistence/interview.rows"
import { SELECT_EVIDENCE, SELECT_HISTORY } from "./persistence/interview.sql"

const pillarOf = (items: ReadonlyArray<EvidenceItem>, family: EvidenceItem["family"]): ReadinessPillar | null => {
    const found = items.find((item) => item.family === family)
    return found === undefined ? null : { bestScore: found.bestScore, verdict: found.verdict }
}

@Injectable()
/**
 * The history, the evidence and the hiring readiness of a learner's interviews. Hiring readiness (a pass at a tier on both pillars)
 * is what the profile and the hiring layer read; interviews never become CV lines.
 */
export class InterviewHistoryService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The sessions of a learner, newest first, with the score trend per track and tier. */
    async history(learnerId: string, track: TrackFilter): Promise<HistoryView> {
        const rows: Array<HistoryRow> = await this.entityManager.query(SELECT_HISTORY, [
            learnerId,
            track ?? "",
            LIST_ROWS_MAX,
        ])
        return { items: rows.map((row) => toHistoryItem(row)), trend: toTrends(rows) }
    }

    /** The best graded result per track, pillar and tier. */
    async evidence(learnerId: string): Promise<ReadonlyArray<EvidenceItem>> {
        const rows: Array<EvidenceRow> = await this.entityManager.query(SELECT_EVIDENCE, [learnerId, LIST_ROWS_MAX])
        return rows.map((row) => toEvidenceItem(row))
    }

    /** The hiring readiness at one track and tier: ready when both pillars hold a pass. */
    async readiness(learnerId: string, track: string, tier: InterviewTier): Promise<ReadinessView> {
        const here = (await this.evidence(learnerId)).filter((item) => item.track === track && item.tier === tier)
        const technical = pillarOf(here, "technical")
        const behavioral = pillarOf(here, "behavioral")
        return {
            track,
            tier,
            technical,
            behavioral,
            ready: technical?.verdict === "pass" && behavioral?.verdict === "pass",
        }
    }
}
