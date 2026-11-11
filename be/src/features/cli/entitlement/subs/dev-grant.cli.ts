import { CommandRunner, Option, SubCommand } from "nest-commander"
import { InjectEntitlementService, type EntitlementService, type PremiumTerm } from "@modules/domain/entitlement"

/** The options of `cli entitlement dev-grant`. */
export interface DevGrantOptions {
    /** The learner (Keycloak subject) who receives Premium. */
    readonly learner: string
    /** The term granted. */
    readonly term: PremiumTerm
}

@SubCommand({
    name: "dev-grant",
    description: "Development only: grant Premium to one learner without a purchase",
})
/**
 * `cli entitlement dev-grant --learner <subject> [--term monthly|yearly]`: delegates to the development grant of the entitlement
 * capability, which is refused ENTITLEMENT_DEV_GRANT_DISABLED unless the environment sets ENTITLEMENT_DEV_GRANT=true.
 */
export class DevGrantCli extends CommandRunner {
    constructor(@InjectEntitlementService() private readonly entitlements: EntitlementService) {
        super()
    }

    /** `--learner <subject>`: the Keycloak subject of the learner. */
    @Option({ flags: "--learner <subject>", description: "The Keycloak subject of the learner", required: true })
    parseLearner(value: string): string {
        return value
    }

    /** `--term <term>`: `monthly` or `yearly`; absent, `yearly`. */
    @Option({
        flags: "--term <term>",
        description: "monthly or yearly",
        choices: ["monthly", "yearly"],
        defaultValue: "yearly",
    })
    parseTerm(value: PremiumTerm): PremiumTerm {
        return value
    }

    /** Grants the term to the learner. */
    async run(_passed: Array<string>, options: DevGrantOptions): Promise<void> {
        await this.entitlements.devGrant({ learnerId: options.learner, term: options.term })
    }
}
