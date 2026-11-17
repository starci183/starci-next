import { EnvSource } from "@modules/platform/config"
import { parseMcpConfig } from "./mcp-config.mapper"

describe("parseMcpConfig", () => {
    it("is keyword-only with no embedder, no Qdrant and no harness content declared", () => {
        expect(parseMcpConfig(new EnvSource({}))).toEqual({
            tokenLimit: 5,
            publicUrl: null,
            embed: null,
            harnessDir: null,
            qdrant: null,
        })
    })

    it("reads the local embedder, the harness content and the Qdrant service the dev stack declares", () => {
        const config = parseMcpConfig(
            new EnvSource({
                MCP_EMBED_URL: "http://localhost:11434",
                MCP_HARNESS_DIR: "D:/content",
                QDRANT_URL: "http://127.0.0.1:3293/",
                QDRANT_VECTOR_SIZE: "1024",
            }),
        )
        expect(config.embed).toEqual({ url: "http://localhost:11434", apiKey: null, model: "qwen3-embedding:8b" })
        expect(config.harnessDir).toBe("D:/content")
        expect(config.qdrant).toMatchObject({
            url: "http://127.0.0.1:3293",
            apiKey: null,
            collection: "starci-next",
            dimensions: 1024,
            timeoutMs: 5000,
        })
    })

    it("reads the token of the shared host embeddings service as a sealed secret", () => {
        const config = parseMcpConfig(
            new EnvSource({ MCP_EMBED_URL: "https://embed.starci.org/v1", AI_API_KEY: "host-token" }),
        )
        expect(config.embed?.url).toBe("https://embed.starci.org/v1")
        expect(config.embed?.apiKey?.reveal()).toBe("host-token")
        expect(JSON.stringify(config)).not.toContain("host-token")
    })

    it("requires the vector size once a Qdrant address is declared", () => {
        expect(() => parseMcpConfig(new EnvSource({ QDRANT_URL: "http://127.0.0.1:3293" }))).toThrow()
    })
})
