import { PathChoiceEntity } from "./path-choice.entity"

export { PathChoiceEntity }

/** The entities of the path capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const pathEntities: ReadonlyArray<new () => object> = [PathChoiceEntity]
