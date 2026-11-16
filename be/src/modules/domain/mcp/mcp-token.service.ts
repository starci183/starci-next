import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX, type sql } from "@modules/platform/database"
import { McpError, McpErrorCode } from "./errors/mcp.error"
import { InjectMcpOptions } from "./mcp.decorators"
import type { McpOptions } from "./mcp.options"
import type { McpTokenIssued, McpTokenView } from "./mcp.contracts"
import { bearerTokenOf, mcpTokenDigest, mcpTokenHint, mcpTokenNameOf, mcpTokenSecret } from "./mcp-token.policy"
import type { McpTokenRow } from "./persistence/mcp.rows"
import { INSERT_TOKEN, REVOKE_TOKEN, SELECT_TOKENS, TOUCH_BY_DIGEST } from "./persistence/mcp.sql"

/** One SQL constant of the mcp persistence. */
type SqlText = ReturnType<typeof sql>

const viewOf = (row: McpTokenRow): McpTokenView => ({
    id: row.token_id,
    name: row.name,
    hint: row.hint,
    createdAt: row.created_at.toISOString(),
    lastUsedAt: row.last_used_at === null ? null : row.last_used_at.toISOString(),
})

@Injectable()
/**
 * The personal access tokens of a learner's AI client: created on the web once (the secret is shown once and kept only as a
 * digest), listed, revoked, and proved on every call of the MCP endpoint, which then acts as exactly that learner.
 */
export class McpTokenService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectMcpOptions() private readonly options: McpOptions,
    ) {}

    /** Creates a token for the learner within the limit; the secret comes back once. */
    async issue(learnerId: string, name: string): Promise<McpTokenIssued> {
        const clean = mcpTokenNameOf(name)
        if (clean === null) throw new McpError({ code: McpErrorCode.TokenNameInvalid })
        if ((await this.list(learnerId)).length >= this.options.tokenLimit)
            throw new McpError({ code: McpErrorCode.TokenLimit })
        const secret = mcpTokenSecret()
        const rows: Array<McpTokenRow> = await this.run(INSERT_TOKEN, [
            learnerId,
            clean,
            mcpTokenDigest(secret),
            mcpTokenHint(secret),
            this.clock.now(),
        ])
        const row = rows[0]
        if (row === undefined) throw new McpError({ code: McpErrorCode.TokenInvalid })
        return { ...viewOf(row), secret }
    }

    /** The learner's working tokens, newest first. */
    async list(learnerId: string): Promise<ReadonlyArray<McpTokenView>> {
        const rows: Array<McpTokenRow> = await this.run(SELECT_TOKENS, [learnerId, LIST_ROWS_MAX])
        return rows.map((row) => viewOf(row))
    }

    /** Revokes one of the learner's tokens at once; a foreign or unknown id is not found. */
    async revoke(learnerId: string, tokenId: string): Promise<string> {
        const rows: Array<{ token_id: string }> = await this.run(REVOKE_TOKEN, [tokenId, learnerId, this.clock.now()])
        const row = rows[0]
        if (row === undefined) throw new McpError({ code: McpErrorCode.TokenNotFound })
        return row.token_id
    }

    /** The learner an `Authorization` header proves, touching the token's last use; anything else is MCP_TOKEN_INVALID. */
    async authenticate(authorization: string | undefined): Promise<string> {
        const secret = bearerTokenOf(authorization)
        if (secret === null) throw new McpError({ code: McpErrorCode.TokenInvalid })
        const rows: Array<{ learner_id: string }> = await this.run(TOUCH_BY_DIGEST, [
            mcpTokenDigest(secret),
            this.clock.now(),
        ])
        const row = rows[0]
        if (row === undefined) throw new McpError({ code: McpErrorCode.TokenInvalid })
        return row.learner_id
    }

    private run<T>(statement: SqlText, params: ReadonlyArray<unknown>): Promise<T> {
        return this.entityManager.query(statement, [...params])
    }
}
