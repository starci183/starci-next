import { PathChoiceEntity } from "./entities/path-choice.entity"
import { InitPath1797900000000 } from "./migrations/1797900000000-init-path"

/** The entities of the path capability. */
export const pathEntities: Array<typeof PathChoiceEntity> = [PathChoiceEntity]

/** The migrations of the path capability, in the order they run. */
export const pathMigrations: Array<typeof InitPath1797900000000> = [InitPath1797900000000]
