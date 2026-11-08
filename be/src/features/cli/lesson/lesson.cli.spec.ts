import { Test } from "@nestjs/testing"
import { LessonCli } from "./lesson.cli"

describe("LessonCli", () => {
    it("shows the help of the group, and runs nothing else, when no sub-command is named", async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [LessonCli],
        }).compile()
        const group = moduleRef.get(LessonCli)
        const help = jest.fn()
        Object.defineProperty(group, "command", { value: { help } })

        await expect(Promise.resolve(group.run())).resolves.toBeUndefined()

        expect(help).toHaveBeenCalledTimes(1)
    })
})
