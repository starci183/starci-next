import { Command, CommandRunner, Option } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay ref`. */
export interface RefLessonOptions {
    /** The language folder asked, or undefined for the default one. */
    readonly lang?: string | undefined
    /** The folder to put the reference in, or undefined for beside the lab. */
    readonly dir?: string | undefined
}

@Command({
    name: "ref",
    arguments: "<lesson>",
    description: "Get a lesson's public reference repository (one language folder, pinned commit) next to your lab; no login",
})
/** `starci-relay ref`: delegates to the learner's relay client once. */
export class RefCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--lang`: the language folder (typescript by default). */
    @Option({ flags: "--lang <lang>", description: "The language folder of the reference (default typescript)" })
    parseLang(value: string): string {
        return value
    }

    /** `--dir`: where to put it; by default the current folder, or its parent when the current folder is a lab. */
    @Option({ flags: "--dir <folder>", description: "The folder to put the reference in (default: beside your lab)" })
    parseDir(value: string): string {
        return value
    }

    /** Gets the reference named by the first argument. */
    async run(passed: Array<string>, options: RefLessonOptions): Promise<void> {
        await this.relay.ref(passed[0] ?? "", options.lang, options.dir)
    }
}
