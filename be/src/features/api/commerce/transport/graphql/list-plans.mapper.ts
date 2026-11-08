import type { ListPlansResult } from "../../application/list-plans.contracts"
import type { PlanType } from "./dto/plan.type"

/** Maps the offers the purchase capability answers to the GraphQL plan types. */
export const toPlanTypes = (offers: ListPlansResult): Array<PlanType> =>
    offers.map((offer) => ({
        plan: offer.plan,
        term: offer.term,
        amountVnd: offer.amountVnd,
        currency: offer.currency,
    }))
