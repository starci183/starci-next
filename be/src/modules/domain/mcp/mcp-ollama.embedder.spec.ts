import { McpOllamaEmbedder } from "./mcp-ollama.embedder"
import type { McpOptions } from "./mcp.options"

const options = (embed: McpOptions["embed"]): McpOptions => ({
    tokenLimit: 5,
    publicUrl: null,
    embed,
})
const LOCAL = { url: "http://localhost:11434", model: "qwen3-embedding:8b" }

const reply = (embeddings: Array<Array<number>>, ok = true): Response =>
    ({ ok, json: () => Promise.resolve({ embeddings }) }) as unknown as Response

describe("McpOllamaEmbedder", () => {
    afterEach(() => jest.restoreAllMocks())

    it("is off and never calls out when no embedder is declared", async () => {
        const fetcher = jest.spyOn(globalThis, "fetch")
        const embedder = new McpOllamaEmbedder(options(null))
        expect(embedder.isConfigured).toBe(false)
        expect(await embedder.embed(["a"])).toBeNull()
        expect(fetcher).not.toHaveBeenCalled()
    })

    it("posts to /api/embed with the model and returns 1024-dimension unit vectors", async () => {
        const fetcher = jest
            .spyOn(globalThis, "fetch")
            .mockResolvedValue(reply([new Array<number>(4096).fill(3), new Array<number>(4096).fill(1)]))
        const vectors = await new McpOllamaEmbedder(options(LOCAL)).embed(["a", "b"])
        expect(String(fetcher.mock.calls[0]?.[0])).toBe("http://localhost:11434/api/embed")
        expect(JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body))).toMatchObject({
            model: "qwen3-embedding:8b",
            input: ["a", "b"],
        })
        expect(vectors).toHaveLength(2)
        expect(vectors?.[0]).toHaveLength(1024)
        expect(Math.hypot(...(vectors?.[0] ?? []))).toBeCloseTo(1, 10)
    })

    it("answers null for an outage, a refusal or a malformed answer so search falls back to keywords", async () => {
        const embedder = new McpOllamaEmbedder(options(LOCAL))
        jest.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("ECONNREFUSED"))
        expect(await embedder.embed(["a"])).toBeNull()
        jest.spyOn(globalThis, "fetch").mockResolvedValueOnce(reply([], false))
        expect(await embedder.embed(["a"])).toBeNull()
        jest.spyOn(globalThis, "fetch").mockResolvedValueOnce(reply([[1, 2, 3]]))
        expect(await embedder.embed(["a"])).toBeNull()
    })
})
