import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import { McpServerFactory } from "./mcp-server.factory"
import type { McpTutorService } from "./mcp-tutor.service"

/** The committed catalog of the server (R302): the `tools/list` result clients rely on, at contract major 1. */
const SNAPSHOT = join(__dirname, "../../../../contracts/core/starci-next@1.tools.json")

const listed = async (): Promise<unknown> => {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair()
    await new McpServerFactory({} as McpTutorService).create("11111111-1111-4111-8111-111111111111").connect(serverSide)
    const client = new Client({ name: "snapshot", version: "1.0.0" })
    await client.connect(clientSide)
    const { tools } = await client.listTools()
    await client.close()
    return { contract: "starci-next@1", server: { name: "starci-next", version: "1.0.0" }, tools }
}

describe("the committed MCP tool catalog", () => {
    it("is the tools/list of the server (set MCP_TOOLS_SNAPSHOT_WRITE=1 to rewrite it after a deliberate change)", async () => {
        const current = `${JSON.stringify(await listed(), null, 2)}\n`
        if (process.env.MCP_TOOLS_SNAPSHOT_WRITE === "1") writeFileSync(SNAPSHOT, current)
        expect(JSON.parse(readFileSync(SNAPSHOT, "utf8"))).toEqual(JSON.parse(current))
    })
})
