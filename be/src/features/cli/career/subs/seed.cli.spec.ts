import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ExperienceSeedService } from "@modules/domain/career"
import { DEV_SEED_SIGNER, SeedExperienceCli } from "./seed.cli"

const LEARNER = "10000000-0000-4000-8000-0000000000c1"

const build = async () => {
    const seeds = mock<ExperienceSeedService>()
    seeds.seed.mockResolvedValue([])
    const moduleRef = await Test.createTestingModule({
        providers: [SeedExperienceCli, { provide: ExperienceSeedService, useValue: seeds }],
    }).compile()
    return { command: moduleRef.get(SeedExperienceCli), seeds }
}

describe("SeedExperienceCli", () => {
    it("delegates the learner and the signer to the development seed once", async () => {
        const { command, seeds } = await build()

        await command.run([], { learner: LEARNER, signer: DEV_SEED_SIGNER })

        expect(seeds.seed).toHaveBeenCalledWith({ learnerId: LEARNER, signerId: DEV_SEED_SIGNER })
        expect(seeds.seed).toHaveBeenCalledTimes(1)
    })

    it("takes --learner and --signer as given", async () => {
        const { command } = await build()

        expect(command.parseLearner(LEARNER)).toBe(LEARNER)
        expect(command.parseSigner(DEV_SEED_SIGNER)).toBe(DEV_SEED_SIGNER)
    })
})
