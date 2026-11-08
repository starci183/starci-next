import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ExperienceReviewService } from "@modules/domain/career"
import { EscalateExperienceCli } from "./escalate.cli"

describe("EscalateExperienceCli", () => {
    it("delegates one escalation batch", async () => {
        const reviews = mock<ExperienceReviewService>()
        reviews.escalateOverdue.mockResolvedValue(2)
        const moduleRef = await Test.createTestingModule({
            providers: [EscalateExperienceCli, { provide: ExperienceReviewService, useValue: reviews }],
        }).compile()

        await expect(moduleRef.get(EscalateExperienceCli).run()).resolves.toBeUndefined()

        expect(reviews.escalateOverdue).toHaveBeenCalledTimes(1)
    })
})
