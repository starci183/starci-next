import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import type { EntityManager } from "typeorm"
import { McpErrorCode } from "./errors/mcp.error"
import { McpTokenService } from "./mcp-token.service"
import { mcpTokenDigest, mcpTokenSecret } from "./mcp-token.policy"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const NOW = "2026-11-17T02:00:00.000Z"

const build = (query: jest.Mock, tokenLimit = 2): McpTokenService => {
    const manager = { ...mockEntityManager(), query } as unknown as EntityManager
    return new McpTokenService(manager, new FakeClock(NOW), {
        tokenLimit,
        publicUrl: null,
        embed: null,
        qdrant: null,
    })
}

const row = {
    token_id: "t1",
    learner_id: LEARNER,
    name: "Claude",
    hint: "abcd",
    created_at: new Date(NOW),
    last_used_at: null,
}

describe("McpTokenService", () => {
    it("proves the learner of a working token by its digest and refuses everything else without asking the database", async () => {
        const secret = mcpTokenSecret()
        const query = jest
            .fn()
            .mockResolvedValueOnce([{ learner_id: LEARNER }])
            .mockResolvedValueOnce([])
        const service = build(query)

        expect(await service.authenticate(`Bearer ${secret}`)).toBe(LEARNER)
        expect(query.mock.calls[0]?.[1]?.[0]).toBe(mcpTokenDigest(secret))
        await expect(service.authenticate(`Bearer ${secret}`)).rejects.toMatchObject({
            code: McpErrorCode.TokenInvalid,
        })

        query.mockClear()
        for (const header of [undefined, "", "Bearer x", `Basic ${secret}`])
            await expect(service.authenticate(header)).rejects.toMatchObject({ code: McpErrorCode.TokenInvalid })
        expect(query).not.toHaveBeenCalled()
    })

    it("shows the secret once, stores only its digest and refuses past the limit", async () => {
        const query = jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([row])
        const created = await build(query).issue(LEARNER, "  Claude ")

        expect(created.secret).toMatch(/^scmcp_/u)
        const insert = query.mock.calls[1]?.[1] as Array<unknown>
        expect(insert).toContain(mcpTokenDigest(created.secret))
        expect(insert).not.toContain(created.secret)
        expect(insert).toContain("Claude")

        const full = jest.fn().mockResolvedValue([row, row])
        await expect(build(full).issue(LEARNER, "Another")).rejects.toMatchObject({ code: McpErrorCode.TokenLimit })
        await expect(build(jest.fn()).issue(LEARNER, "   ")).rejects.toMatchObject({
            code: McpErrorCode.TokenNameInvalid,
        })
    })

    it("revokes only the token of the learner who asks", async () => {
        const query = jest
            .fn()
            .mockResolvedValueOnce([{ token_id: "t1" }])
            .mockResolvedValueOnce([])
        const service = build(query)
        expect(await service.revoke(LEARNER, "t1")).toBe("t1")
        expect(query.mock.calls[0]?.[1]?.[1]).toBe(LEARNER)
        await expect(service.revoke("someone-else", "t1")).rejects.toMatchObject({ code: McpErrorCode.TokenNotFound })
    })
})
