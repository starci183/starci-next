import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-next pull`. */
export interface PullLessonOptions {
    /** The language asked, or undefined. */
    readonly lang?: string | undefined
    /** True to pull the Tìm sạn bug pack instead of the source. */
    readonly bugs?: boolean | undefined
}

@Command({
    name: "pull",
    arguments: "<lesson>",
    description: "Get a lesson's source repo at the commit StarCi signed (TypeScript)",
})
/** `starci-next pull`: delegates to the learner's relay client once. */
export class PullCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--lang`: only typescript exists; anything else is refused. */
    @Option({ flags: "--lang <lang>", description: "The language of the lesson repo (typescript only)" })
    parseLang(value: string): string {
        return value
    }

    /** `--bugs`: the Tìm sạn bug pack (the buggy copy of the source) into `./<lesson>-bugs`. */
    @Option({ flags: "--bugs", description: "Pull the Tìm sạn bug pack into ./<lesson>-bugs", defaultValue: false })
    parseBugs(): boolean {
        return true
    }

    /** Pulls the lesson named by the first argument. */
    async run(passed: Array<string>, options: PullLessonOptions): Promise<void> {
        await this.relay.pull(passed[0] ?? "", options.lang, options.bugs === true)
    }
}
