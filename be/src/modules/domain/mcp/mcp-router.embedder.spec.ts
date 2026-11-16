import { createRouter } from "@starci/ai-router/gateway"
import { Secret } from "@modules/platform/config"
import type { McpIndexOptions } from "./mcp-index.options"
import { McpRouterEmbedder, localBaseUrlOf } from "./mcp-router.embedder"

jest.mock("@starci/ai-router/gateway", () => ({
    createRouter: jest.fn(),
    localModel: jest.fn((id: string, options: unknown) => ({ id, options })),
}))

const options = (embed: McpIndexOptions["embed"]): McpIndexOptions => ({ embed, harnessDir: null, qdrant: null })
const LOCAL = { url: "http://localhost:11434", apiKey: null, model: "qwen3-embedding:8b" }
const HOST = { url: "https://embed.starci.org/v1", apiKey: new Secret("host-token"), model: "qwen3-embedding:8b" }

const routerAnswering = (embeddings: jest.Mock): void => {
    ;(createRouter as jest.Mock).mockReturnValue({ embeddings })
}
const item = (index: number, value: number, size = 1024): { index: number; embedding: Array<number> } => ({
    index,
    embedding: new Array<number>(size).fill(value),
})

describe("McpRouterEmbedder", () => {
    afterEach(() => jest.clearAllMocks())

    it("names the OpenAI-compatible base of a local server", () => {
        expect(localBaseUrlOf("http://localhost:11434")).toBe("http://localhost:11434/v1")
        expect(localBaseUrlOf("http://localhost:11434/v1/")).toBe("http://localhost:11434/v1")
    })

    it("is off and builds no router when no embedder is declared", async () => {
        const embedder = new McpRouterEmbedder(options(null))
        expect(embedder.isConfigured).toBe(false)
        expect(embedder.model).toBe("off/1024")
        expect(await embedder.embed(["a"])).toBeNull()
        expect(createRouter).not.toHaveBeenCalled()
    })

    it("declares a keyless local provider with a pinned MRL 1024 embeddings profile and returns unit vectors", async () => {
        const embeddings = jest.fn().mockResolvedValue({ data: [item(1, 1), item(0, 3)] })
        routerAnswering(embeddings)
        const embedder = new McpRouterEmbedder(options(LOCAL))

        const config = (createRouter as jest.Mock).mock.calls[0]?.[0]
        expect(config.providers[0]).toMatchObject({ kind: "local", baseUrl: "http://localhost:11434/v1" })
        expect(config.providers[0].models[0]).toEqual({ id: "qwen3-embedding:8b", options: { dimensions: 1024 } })
        expect(config.providers[0].keys).toEqual([])
        expect(config.profiles["local-embed"]).toMatchObject({ pinned: true, model: "qwen3-embedding:8b" })
        expect(embedder.model).toBe("qwen3-embedding:8b/1024")

        const vectors = await embedder.embed(["a", "b"])
        expect(embeddings).toHaveBeenCalledWith({ model: "local-embed", input: ["a", "b"] })
        expect(vectors).toHaveLength(2)
        expect(vectors?.[0]).toHaveLength(1024)
        expect(Math.hypot(...(vectors?.[0] ?? []))).toBeCloseTo(1, 10)
    })

    it("reads the token of the shared host service from the sealed secret at each attempt", async () => {
        routerAnswering(jest.fn())
        new McpRouterEmbedder(options(HOST))
        const config = (createRouter as jest.Mock).mock.calls[0]?.[0]
        expect(config.providers[0].baseUrl).toBe("https://embed.starci.org/v1")
        expect(config.providers[0].keys).toHaveLength(1)
        expect(config.providers[0].keys[0].resolve()).toBe("host-token")
        expect(JSON.stringify(config)).not.toContain("host-token")
    })

    it("sends at most 16 texts per call", async () => {
        const embeddings = jest
            .fn()
            .mockImplementation(({ input }: { input: Array<string> }) =>
                Promise.resolve({ data: input.map((_, index) => item(index, 1)) }),
            )
        routerAnswering(embeddings)
        const vectors = await new McpRouterEmbedder(options(LOCAL)).embed(Array.from({ length: 20 }, () => "t"))
        expect(embeddings).toHaveBeenCalledTimes(2)
        expect(vectors).toHaveLength(20)
    })

    it("answers null for an outage, a short answer or a vector of another size so search falls back to keywords", async () => {
        const embeddings = jest.fn()
        routerAnswering(embeddings)
        const embedder = new McpRouterEmbedder(options(LOCAL))
        embeddings.mockRejectedValueOnce(new Error("network"))
        expect(await embedder.embed(["a"])).toBeNull()
        embeddings.mockResolvedValueOnce({ data: [] })
        expect(await embedder.embed(["a"])).toBeNull()
        embeddings.mockResolvedValueOnce({ data: [item(0, 1, 3)] })
        expect(await embedder.embed(["a"])).toBeNull()
    })
})
