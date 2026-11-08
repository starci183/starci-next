import { CommandRunner, Option, SubCommand } from "nest-commander"
import { ExperienceSeedService } from "@modules/domain/career"

/** The signer of the verified sample when none is named: a fixed development subject, never a real account. */
export const DEV_SEED_SIGNER = "00000000-0000-4000-8000-00000000d0d0"

/** The options of `cli career seed`. */
export interface SeedExperienceOptions {
    /** The learner (Keycloak subject) the samples belong to. */
    readonly learner: string
    /** The signer of the verified sample. */
    readonly signer: string
}

@SubCommand({
    name: "seed",
    description: "Development only: create sample experience items (graded, pending review, verified) for one learner",
})
/**
 * `cli career seed --learner <subject> [--signer <subject>]`: delegates to the development seed of the experience engine, which is
 * refused CAREER_DEV_SEED_DISABLED unless the environment sets CAREER_DEV_SEED=true (the development stack only).
 */
export class SeedExperienceCli extends CommandRunner {
    constructor(private readonly seeds: ExperienceSeedService) {
        super()
    }

    /** `--learner <subject>`: the Keycloak subject of the learner. */
    @Option({ flags: "--learner <subject>", description: "The Keycloak subject of the learner", required: true })
    parseLearner(value: string): string {
        return value
    }

    /** `--signer <subject>`: the subject the verified sample is signed by. */
    @Option({
        flags: "--signer <subject>",
        description: "The signer of the verified sample",
        defaultValue: DEV_SEED_SIGNER,
    })
    parseSigner(value: string): string {
        return value
    }

    /** Seeds the samples of the learner. */
    async run(_passed: Array<string>, options: SeedExperienceOptions): Promise<void> {
        await this.seeds.seed({ learnerId: options.learner, signerId: options.signer })
    }
}
