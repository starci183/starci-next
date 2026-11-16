import { Test } from "@nestjs/testing"
import { McpHarnessService } from "@modules/domain/mcp"
import { McpCli } from "./mcp.cli"
import { ReindexMcpCli } from "./subs/reindex.cli"

describe("McpCli", () => {
    it("shows the help of the group when no sub-command is named", async () => {
        const moduleRef = await Test.createTestingModule({ providers: [McpCli] }).compile()
        const group = moduleRef.get(McpCli)
        const help = jest.fn()
        Object.defineProperty(group, "command", { value: { help } })

        await expect(Promise.resolve(group.run())).resolves.toBeUndefined()

        expect(help).toHaveBeenCalledTimes(1)
    })
})

describe("ReindexMcpCli", () => {
    it("runs the harness batch job once", async () => {
        const reindex = jest.fn().mockResolvedValue({
            documents: 4,
            scopes: [{ scope: "harness:vi", chunks: 3, embedded: 1, reused: 2, pruned: 0 }],
        })
        const moduleRef = await Test.createTestingModule({
            providers: [ReindexMcpCli, { provide: McpHarnessService, useValue: { reindex } }],
        }).compile()

        await moduleRef.get(ReindexMcpCli).run()

        expect(reindex).toHaveBeenCalledTimes(1)
    })
})
