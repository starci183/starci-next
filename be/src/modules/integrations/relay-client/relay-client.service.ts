import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { HttpClient } from "@modules/platform/http"
import { InjectIds, type Ids } from "@modules/platform/ids"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { ManifestPolicy } from "./manifest.policy"
import { devicesCommand, loginCommand, logoutCommand, statusCommand } from "./pairing.cli"
import {
    InjectRelayClientHttp,
    InjectRelayClientOptions,
    InjectRelayCorrelation,
    InjectRelayTerminal,
} from "./relay-client.decorators"
import type { CliIo, FetchAnswer, FetchInit, TerminalPort } from "./relay-client.contracts"
import type { RelayClientModuleOptions } from "./relay-client.options"
import type { InitOptions, RelayClientPort } from "./relay-client.port"
import { ProjectKitService } from "./project-kit.service"
import { runTask } from "./task-run.cli"

/** How long one call to StarCi may take before it counts as unreachable. */
const REQUEST_TIMEOUT_MS = 30_000

@Injectable()
/** The learner commands over this process: the outbound HTTP port, the clock, the timer, the ids, the terminal and the config folder. */
export class RelayClientService implements RelayClientPort {
    private readonly io: CliIo
    private readonly cwd: string

    constructor(
        @InjectRelayClientOptions() options: RelayClientModuleOptions,
        @InjectRelayTerminal() terminal: TerminalPort,
        @InjectClock() clock: Clock,
        @InjectIds() ids: Ids,
        @InjectTimer() timer: Timer,
        @InjectRelayClientHttp() private readonly http: HttpClient,
        @InjectRelayCorrelation() private readonly correlationId: string,
        manifests: ManifestPolicy,
        private readonly kit: ProjectKitService,
    ) {
        this.cwd = options.cwd ?? process.cwd()
        this.io = {
            env: options.env,
            out: (line) => terminal.out(line),
            err: (line) => terminal.err(line),
            hostName: () => terminal.hostName(),
            platform: () => terminal.platform(),
            exit: (code) => terminal.exit(code),
            confirm: (question) => terminal.confirm(question),
            runCommand: (command, cwd, timeoutMs) => terminal.runCommand(command, cwd, timeoutMs),
            verify: (payload, signature, key) => manifests.verified(payload, signature, key),
            fetch: (url, init) => this.door(url, init),
            sleep: (ms) => new Promise((resolve) => timer.schedule(() => resolve(undefined), ms)),
            now: () => clock.now().getTime(),
            ids: () => ids.next(),
        }
    }

    /** Pairs this machine with the learner's StarCi account. */
    async login(): Promise<void> {
        this.io.exit(await loginCommand(this.io))
    }

    /** Forgets this machine's device token. */
    logout(): Promise<void> {
        this.io.exit(logoutCommand(this.io))
        return Promise.resolve()
    }

    /** Prints where StarCi is and whether this machine is paired. */
    status(): Promise<void> {
        this.io.exit(statusCommand(this.io))
        return Promise.resolve()
    }

    /** Points at the devices page. */
    devices(): Promise<void> {
        this.io.exit(devicesCommand(this.io))
        return Promise.resolve()
    }

    /** Runs a task's signed checks on this machine and sends the results. */
    async run(args: ReadonlyArray<string>, yes: boolean): Promise<void> {
        const [taskId = ""] = args
        this.io.exit(
            this.kit.isProject(this.cwd)
                ? await this.kit.run(this.io, taskId, yes, this.cwd)
                : await runTask(this.io, taskId, yes),
        )
    }

    /** Copies the project kit into the project in the current folder. */
    init(options: InitOptions): Promise<void> {
        this.io.exit(this.kit.init(this.io, options, this.cwd))
        return Promise.resolve()
    }

    /** Calls a StarCi door through the HTTP port; no answer (refused, timed out, cut) answers status 0 with the cause. */
    private async door(url: string, init: FetchInit): Promise<FetchAnswer> {
        try {
            const answer = await this.http.request({
                correlationId: this.correlationId,
                method: "POST",
                url,
                headers: init.headers,
                bytes: Buffer.from(init.body, "utf8"),
                read: "bytes",
                timeoutMs: REQUEST_TIMEOUT_MS,
            })
            return { status: answer.status, text: Buffer.isBuffer(answer.body) ? answer.body.toString("utf8") : "" }
        } catch (cause) {
            return { status: 0, text: "", cause }
        }
    }
}
