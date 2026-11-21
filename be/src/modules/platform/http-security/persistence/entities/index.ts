import { RateWindowEntity } from "./rate-window.entity"

export { RateWindowEntity }

/** The entities of the http-security capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const httpSecurityEntities: ReadonlyArray<new () => object> = [RateWindowEntity]
