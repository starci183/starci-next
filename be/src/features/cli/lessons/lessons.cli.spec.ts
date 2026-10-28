import { Test } from "@nestjs/testing"
import { LessonsCli } from "./lessons.cli"

describe("LessonsCli", () => {
    it("shows the help of the group, and runs nothing else, when no sub-command is named", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [LessonsCli],
        }).compile()
        const group = moduleRef.get(LessonsCli)
        const help = jest.fn()
        Object.defineProperty(group, "command", { value: { help } })

        await expect(Promise.resolve(group.run())).resolves.toBeUndefined()

        expect(help).toHaveBeenCalledTimes(1)
    })
})
