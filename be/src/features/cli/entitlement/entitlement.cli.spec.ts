import { Test } from "@nestjs/testing"
import { EntitlementCli } from "./entitlement.cli"

describe("EntitlementCli", () => {
    it("shows the help of the group, and runs nothing else, when no sub-command is named", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [EntitlementCli],
        }).compile()
        const group = moduleRef.get(EntitlementCli)
        const help = jest.fn()
        Object.defineProperty(group, "command", { value: { help } })

        await expect(Promise.resolve(group.run())).resolves.toBeUndefined()

        expect(help).toHaveBeenCalledTimes(1)
    })
})
