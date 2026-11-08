import { Test } from "@nestjs/testing"
import { InterviewCli } from "./interview.cli"

describe("InterviewCli", () => {
    it("shows the help of the group when no sub-command is named", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [InterviewCli] }).compile()
        const group = moduleRef.get(InterviewCli)
        const help = jest.fn()
        Object.defineProperty(group, "command", { value: { help } })

        await expect(Promise.resolve(group.run())).resolves.toBeUndefined()

        expect(help).toHaveBeenCalledTimes(1)
    })
})
