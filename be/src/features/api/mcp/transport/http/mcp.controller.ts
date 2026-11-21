import { Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Req, Res } from "@nestjs/common"
import type { Request, Response } from "express"
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"
import { Public, PublicReason } from "@modules/domain/identity"
import { isMcpLessonId, McpServerFactory, McpTokenService } from "@modules/domain/mcp"
import { RateLimit, RateTier } from "@modules/platform/http-security"

/** The JSON-RPC answer of a method the stateless endpoint does not offer (no server stream, no session to end). */
const METHOD_NOT_ALLOWED = {
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed: this endpoint is stateless, POST every request." },
    id: null,
} as const

@Controller("mcp")
/**
 * POST /mcp, the remote MCP endpoint of the Claude or ChatGPT of one learner (Streamable HTTP, stateless: one server per
 * request). It proves the learner by the bearer access token created on the web (`McpTokenService.authenticate`) before
 * anything is read, then builds the server for exactly that learner. The door is marked Public because the session guard
 * cannot know a bearer token; every handler of the server is closed over the learner the token proved.
 */
export class McpController {
    constructor(
        private readonly tokens: McpTokenService,
        private readonly servers: McpServerFactory,
    ) {}

    /** Handles one JSON-RPC message of the MCP protocol for the learner of the token. */
    @Post()
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.ProtocolBearer })
    @RateLimit(RateTier.Default)
    async handle(@Req() request: Request, @Res() response: Response): Promise<void> {
        await this.serve(request, response, null)
    }

    /**
     * POST /mcp/l/<lesson id>, the MCP of one lesson (`starci-<lesson id>` in the client config): the same tools, each reading that
     * lesson when it names none and refusing any other. Access per part stays the learner's own.
     */
    @Post("l/:lessonId")
    @HttpCode(HttpStatus.OK)
    @Public({ reason: PublicReason.ProtocolBearer })
    @RateLimit(RateTier.Default)
    async handleLesson(
        @Param("lessonId") lessonId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<void> {
        if (!isMcpLessonId(lessonId)) throw new NotFoundException()
        await this.serve(request, response, lessonId)
    }

    /** Proves the learner by the token, then answers one JSON-RPC message with a server for that learner (and lesson). */
    private async serve(request: Request, response: Response, lessonId: string | null): Promise<void> {
        const learnerId = await this.tokens.authenticate(request.headers.authorization)
        const server = this.servers.create(learnerId, lessonId)
        const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true })
        response.on("close", () => {
            void transport.close()
            void server.close()
        })
        await server.connect(transport)
        await transport.handleRequest(request, response, request.body)
    }

    /** There is no server-initiated stream: a GET is answered 405 so a client does not wait for one. */
    @Get()
    @Public({ reason: PublicReason.ProtocolBearer })
    @RateLimit(RateTier.Default)
    refuseStream(@Res() response: Response): void {
        response.status(HttpStatus.METHOD_NOT_ALLOWED).header("Allow", "POST").json(METHOD_NOT_ALLOWED)
    }

    /** There is no session to end. */
    @Delete()
    @Public({ reason: PublicReason.ProtocolBearer })
    @RateLimit(RateTier.Default)
    refuseEnd(@Res() response: Response): void {
        response.status(HttpStatus.METHOD_NOT_ALLOWED).header("Allow", "POST").json(METHOD_NOT_ALLOWED)
    }
}
