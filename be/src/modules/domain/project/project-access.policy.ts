import type { EntitlementService } from "@modules/domain/entitlement"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"

/**
 * The one subscription gate of the Projects capability: every call that creates a project, runs a check, appends evidence or asks the
 * AI to read code asks it, so a learner without Premium is refused by the back end, whatever the screen shows. The question is the
 * entitlement capability's own (`isPremium`); this gate keeps no second source of truth. A refused learner causes no probe, no AI call and
 * no row of evidence. Reads stay open: a project made before Projects became subscription-only keeps its history, read-only.
 */
export const assertSubscriber = async (entitlement: EntitlementService, learnerId: string): Promise<void> => {
    if (!(await entitlement.isPremium(learnerId))) throw new ProjectError({ code: ProjectErrorCode.PremiumRequired })
}
