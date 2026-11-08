import type { Type } from "@nestjs/common"
import type { ModuleFactory } from "@starci/test-world"
import type { EntityManager } from "typeorm"
import { StreakModule, StreakService } from "@modules/domain/streak"
import { STORED_STREAK_ACTIONS, STORE_STREAK_STATE } from "../fixtures/persistence/streak.sql"

/** The modules of the streak worlds: the streak capability with its default rules. */
export const streakModules: ReadonlyArray<ModuleFactory> = [() => StreakModule.register({})]

/** What a booted world resolves providers with. */
export interface StreakWorldResolver {
    /** Answers the provider registered under the class. */
    resolve<TProvider>(token: Type<TProvider>): TProvider
}

/** The streak service of a booted world. */
export const streaksOf = (world: StreakWorldResolver): StreakService => world.resolve(StreakService)

/** One stored action as a world spec reads it back. */
export interface StoredStreakActionRow {
    /** The action id. */
    readonly action_id: string
    /** The shard. */
    readonly shard: string
    /** The kind. */
    readonly kind: string
    /** The day. */
    readonly day: string
}

/** Reads the actions of a learner as the database holds them. */
export const storedStreakActionsOf = async (
    manager: EntityManager | undefined,
    learnerId: string,
): Promise<Array<StoredStreakActionRow>> =>
    (await manager?.query<Array<StoredStreakActionRow>>(STORED_STREAK_ACTIONS, [learnerId])) ?? []

/** A learner's stored streak state, as storeStreakState writes it. */
export interface StoredStreakState {
    readonly learnerId: string
    readonly current: number
    readonly longest: number
    readonly lastClosedDay: string
    readonly grantWeek: string
    readonly freezes: number
}

/** Stores a learner who was last seen some days ago, to prove how the missed days close. */
export const storeStreakState = async (manager: EntityManager | undefined, state: StoredStreakState): Promise<void> => {
    await manager?.query(STORE_STREAK_STATE, [
        state.learnerId,
        state.current,
        state.longest,
        state.lastClosedDay,
        state.grantWeek,
        state.freezes,
    ])
}
