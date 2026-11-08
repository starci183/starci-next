import { Test } from "@nestjs/testing"
import { ProjectErrorCode } from "./errors/project.error"
import { repositoryOf } from "./project-repository.policy"

const POLICY: unique symbol = Symbol("project.repository-policy")

const build = async (): Promise<typeof repositoryOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => repositoryOf }],
    }).compile()
    return moduleRef.get<typeof repositoryOf>(POLICY)
}

describe("repositoryOf", () => {
    it("keeps an owner/name and reduces a pasted github.com address to it", async () => {
        const policy = await build()

        expect(policy(" starci/shop ")).toBe("starci/shop")
        expect(policy("https://github.com/Starci-Lab/shop.api.git")).toBe("Starci-Lab/shop.api")
        expect(policy("https://github.com/starci/shop/")).toBe("starci/shop")
    })

    it.each(["starci", "starci/shop/extra", "-starci/shop", "starci/sh op", "starci/..", "https://gitlab.com/a/b", ""])(
        "refuses %p",
        async (input) => {
            const policy = await build()

            expect(() => policy(input)).toThrow(ProjectErrorCode.RepositoryInvalid)
        },
    )
})
