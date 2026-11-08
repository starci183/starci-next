/**
 * The path capability (the goal layer): the five outcome paths and the one path each learner follows.
 *
 * - `PathService.catalog(learnerId, locale)`: the paths with their done outcome, stages and steps, and `activePathId`.
 * - `PathService.active(learnerId, locale)`: the followed path with its next three steps, for the hub; null when none is chosen.
 * - `PathService.choose(learnerId, pathId)`: follows a path (PATH_NOT_FOUND for an id outside the catalog). The same path again
 *   keeps the first time; a switch keeps every other record of the learner.
 *
 * A path holds no streak and grants no experience. It never gates a part: every part works alone.
 */
export { PATH_ERROR_KINDS } from "./errors/path.error"
export { PATH_MESSAGES } from "./messages/path.messages"
export { pathEntities, pathMigrations } from "./persistence/connection"
export type { PathCatalogView, PathChosen, PathLocale } from "./path.contracts"
export { PathModule } from "./path.module"
export { PathService } from "./path.service"
