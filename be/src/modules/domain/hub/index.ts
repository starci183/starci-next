/**
 * The hub capability: the screen a learner opens first.
 *
 * - `HubService.read(learnerId, locale)`: the streak, what is left for today and the six learning shards with their own
 *   progress, the active path and the three layers. Each shard's source is read on its own: one that fails is logged and
 *   its card shows as unavailable, and the hub still answers. Opening the hub counts for nothing in the streak.
 *
 * The hub stores nothing. The experience counts come through a port the app binds.
 */
export { HUB_MESSAGES } from "./messages/hub.messages"
export type { HubLocale, LearnerHubView } from "./hub.contracts"
export { HubModule } from "./hub.module"
export { HubService } from "./hub.service"
