import type { StreakGoalView, StreakSummary } from "@modules/domain/streak"
import type { IdentityPrincipal } from "@modules/domain/identity"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetStreakGoalRequest } from "../../application/set-streak-goal.contracts"
import type { SetStreakGoalInput } from "./dto/set-streak-goal.input"
import type { StreakGoalType } from "./dto/streak-goal.type"
import type { StreakType } from "./dto/streak.type"

/** Maps the session to the params of a message without a request. */
export const toStreakParams = (identity: IdentityPrincipal): ExecuteParams<Record<string, never>> => ({
    request: {},
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the goal input and the session to the message params. */
export const toSetStreakGoalParams = (
    identity: IdentityPrincipal,
    input: SetStreakGoalInput,
): ExecuteParams<SetStreakGoalRequest> => ({
    request: input,
    principal: { id: identity.subject, role: "authenticated" },
})

/** Maps the streak to its GraphQL type. */
export const toStreakType = (view: StreakSummary): StreakType => ({
    ...view,
    days: view.days.map((day) => ({ ...day, shards: [...day.shards] })),
    shardCounters: [...view.shardCounters],
    badges: [...view.badges],
})

/** Maps the goal to its GraphQL type. */
export const toStreakGoalType = (view: StreakGoalView): StreakGoalType => view
