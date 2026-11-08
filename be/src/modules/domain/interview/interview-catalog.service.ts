import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import { InterviewAccessService } from "./interview-access.service"
import { InjectInterviewResolvedOptions } from "./interview.decorators"
import type { InterviewLocale, InterviewOptionsView, TrackFilter, TrackOption } from "./interview.contracts"
import { toHistoryItem } from "./interview-session.mapper"
import type { InterviewSettings } from "./interview.options"
import type { BankOptionRow, SessionRow } from "./persistence/interview.rows"
import { ABANDON_IDLE, SELECT_ACTIVE_SESSION, SELECT_BANK_OPTIONS } from "./persistence/interview.sql"
import { inTrack, tracksOf } from "./track.policy"

@Injectable()
/** Serves the options of the interview home: the tracks, the live banks of a track, the access of the learner and the session in progress. */
export class InterviewCatalogService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectInterviewResolvedOptions() private readonly settings: InterviewSettings,
        private readonly access: InterviewAccessService,
    ) {}

    /** The options for a learner; an idle session is abandoned first so it never blocks the next start. */
    async options(learnerId: string, locale: InterviewLocale, track: TrackFilter): Promise<InterviewOptionsView> {
        const now = this.clock.now()
        const idle = new Date(now.getTime() - this.settings.idleMinutes * 60_000)
        await this.entityManager.query(ABANDON_IDLE, [learnerId, idle, now])
        const tracks = tracksOf(this.settings.pool)
        const chosen = tracks.find((entry) => entry.id === track)
        const banks: Array<BankOptionRow> = await this.entityManager.query(SELECT_BANK_OPTIONS, [locale, LIST_ROWS_MAX])
        const active: Array<SessionRow> = await this.entityManager.query(SELECT_ACTIVE_SESSION, [learnerId])
        const access = await this.access.accessOf(learnerId)
        const held = active[0]
        return {
            tracks: tracks.map((entry): TrackOption => ({ id: entry.id, title: entry.titles[locale] })),
            banks: banks
                .filter((bank) => chosen === undefined || inTrack(chosen, bank.family, bank.bank_id))
                .map((bank) => ({
                    bankId: bank.bank_id,
                    family: bank.family,
                    title: bank.title,
                    difficulty: bank.difficulty,
                    tiers: bank.tiers,
                    languages: bank.languages,
                    questionCount: bank.question_count,
                    freeQuestionCount: bank.free_question_count,
                })),
            access: {
                isPremium: access.isPremium,
                freeSessionsLeftThisMonth: access.freeSessionsLeftThisMonth,
                resetsAt: access.resetsAt,
                length: access.length,
            },
            active: held === undefined ? null : toHistoryItem(held),
        }
    }
}
