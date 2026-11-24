import { CommandRunner, Option, SubCommand } from "nest-commander"
import { InjectRelayClient, type RelayClientPort } from "@modules/integrations/relay-client"

/** The options of `starci-relay lab start`, as the flags give them. */
export interface LabStartCliFlags {
    /** The folder to put the lab in. */
    readonly dir?: string
    /** Run what StarCi asks without the y/N question. */
    readonly autoConfirm: boolean
}

@SubCommand({
    name: "start",
    arguments: "<lab>",
    description:
        "Start a lab (<course>/<lesson>) in a folder you choose (--dir; default ~/starci/<course>/<lesson>), then wait for the lesson page",
})
/** `starci-relay lab start <course>/<lesson>`: delegates to the learner relay client once. */
export class LabStartCli extends CommandRunner {
    constructor(@InjectRelayClient() private readonly relay: RelayClientPort) {
        super()
    }

    /** `--dir <path>`: the lab's folder. */
    @Option({ flags: "--dir <path>", description: "The folder for the lab (default ~/starci/<course>/<lesson>)" })
    parseDir(value: string): string {
        return value
    }

    /** `--auto-confirm`: do not ask. */
    @Option({
        flags: "--auto-confirm",
        description: "Run what StarCi asks without asking first",
        defaultValue: false,
    })
    parseAutoConfirm(): boolean {
        return true
    }

    /** Starts the lab through the relay client. */
    async run(passed: Array<string>, options: LabStartCliFlags): Promise<void> {
        await this.relay.labStart(passed[0] ?? "", { dir: options.dir, autoConfirm: options.autoConfirm })
    }
}
