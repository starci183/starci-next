import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay mcp`, as the flags give them. */
export interface McpCliFlags {
    /** A concept graph file instead of the lab's `.starci/concepts.yaml`. */
    readonly concepts?: string
}

@Command({
    name: "mcp",
    description:
        "Serve the MCP of the lab in this folder over stdio, for Claude Code, Cursor or Codex (lesson context, cases, hints, explain)",
})
/** `starci-relay mcp`: delegates to the learner relay client once; it returns when the editor closes the stream. */
export class McpCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--concepts <file>`: the concept graph to read. */
    @Option({ flags: "--concepts <file>", description: "A concepts.yaml to read instead of the lab's .starci/concepts.yaml" })
    parseConcepts(value: string): string {
        return value
    }

    /** Serves the MCP. */
    async run(_passed: Array<string>, options: McpCliFlags): Promise<void> {
        await this.relay.mcp({ concepts: options.concepts })
    }
}
