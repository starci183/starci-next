import { homedir } from "node:os"
import { Injectable } from "@nestjs/common"
import { NodeProcessPort } from "@modules/platform/check-flow-local"
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
import { openDeviceSocket } from "./device-socket.client"
import { listenCommand, type ListenOptions } from "./listen.cli"
import { composeLesson, promptLesson, pullLesson, runLesson } from "./lesson.cli"
import type { LessonRunOptions } from "./lesson.contracts"
import type { HarnessCiReportOptions, HarnessE2eOptions } from "./harness.contracts"
import { ciReportBuild, e2eBuild, pullBuild } from "./harness.cli"
import type { DoctorOptions, HarnessIo, TrialOptions } from "./harness-trial.contracts"
import { doctorCommand } from "./harness-doctor.cli"
import { trialCommand } from "./harness-trial.cli"

/** How long one call to StarCi may take before it counts as unreachable. */
const REQUEST_TIMEOUT_MS = 30_000

/** How long the lesson tarball may take to download. */
const DOWNLOAD_TIMEOUT_MS = 120_000

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
            isTty: () => terminal.isTty(),
            listen: (baseUrl, token, handlers) => openDeviceSocket(baseUrl, token, handlers),
            hasEnv: (name) => terminal.hasEnv?.(name) === true,
            ciEnv: (name) => terminal.ciEnv?.(name),
            runCommand: (command, cwd, timeoutMs, env, quiet) =>
                terminal.runCommand(command, cwd, timeoutMs, env, quiet),
            verify: (payload, signature, key) => manifests.verified(payload, signature, key),
            fetch: (url, init) => this.door(url, init),
            download: (url, bearer) => this.fetchBytes(url, bearer),
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

    /** Gets a lesson repo at the signed commit. */
    async pull(lesson: string, lang: string | undefined): Promise<void> {
        this.io.exit(await pullLesson(this.io, lesson, lang, this.cwd))
    }

    /** Starts or stops the lesson containers. */
    async compose(action: "up" | "down"): Promise<void> {
        this.io.exit(await composeLesson(this.io, action, this.cwd))
    }

    /** Runs (or checks) the signed scenarios of a lesson. */
    async lessonRun(lesson: string, options: LessonRunOptions, isCheck: boolean): Promise<void> {
        this.io.exit(await runLesson(this.io, lesson, options, isCheck, this.cwd))
    }

    /** Listens for the run requests StarCi pushes and runs them after the learner agrees. */
    async listen(options: ListenOptions): Promise<void> {
        this.io.exit(await listenCommand(this.io, options, this.cwd))
    }

    /** Prints the fix prompt of a scenario. */
    async prompt(lesson: string, scenario: string | undefined): Promise<void> {
        this.io.exit(await promptLesson(this.io, lesson, scenario, this.cwd))
    }

    /** Gets a harness build's source at the signed commit. */
    async harnessPull(build: string): Promise<void> {
        this.io.exit(await pullBuild(this.io, build, this.cwd))
    }

    /** Runs the signed e2e command of a build and sends the stage results. */
    async harnessE2e(build: string | undefined, options: HarnessE2eOptions): Promise<void> {
        this.io.exit(await e2eBuild(this.io, build, options, this.cwd))
    }

    /** Posts the harness lines of a CI run to the project-ci door. */
    async harnessCiReport(options: HarnessCiReportOptions): Promise<void> {
        this.io.exit(await ciReportBuild(this.io, options, this.cwd))
    }

    /** Copies the project kit into the project in the current folder. */
    init(options: InitOptions): Promise<void> {
        this.io.exit(this.kit.init(this.io, options, this.cwd))
        return Promise.resolve()
    }

    /** Runs the doctor probes of the content against this machine and the project in the current folder. */
    async harnessDoctor(options: DoctorOptions): Promise<void> {
        this.io.exit(await doctorCommand(this.harnessIo(), options, this.cwd))
    }

    /** Runs the learner's own agent on a trap repo and prints the verdict. */
    async harnessTrial(trap: string, options: TrialOptions): Promise<void> {
        this.io.exit(await trialCommand(this.harnessIo(), trap, options, this.cwd))
    }

    /** The learner CLI's terminal and ports, plus what the harness commands add: processes, the home folder, the agent programs. */
    private harnessIo(): HarnessIo {
        return {
            ...this.io,
            proc: new NodeProcessPort(),
            home: homedir(),
            bins: {
                claude: this.io.env.STARCI_NEXT_CLAUDE_BIN ?? "claude",
                codex: this.io.env.STARCI_NEXT_CODEX_BIN ?? "codex",
            },
            processEnv: process.env,
        }
    }

    /** GETs the bytes behind a signed URL; no answer (refused, timed out, cut) answers status 0 with no bytes. */
    private async fetchBytes(
        url: string,
        bearer: string | undefined,
    ): Promise<{ readonly status: number; readonly bytes: Buffer }> {
        try {
            const answer = await this.http.request({
                correlationId: this.correlationId,
                method: "GET",
                url,
                headers: bearer === undefined ? {} : { authorization: `Bearer ${bearer}` },
                read: "bytes",
                timeoutMs: DOWNLOAD_TIMEOUT_MS,
            })
            return { status: answer.status, bytes: Buffer.isBuffer(answer.body) ? answer.body : Buffer.alloc(0) }
        } catch {
            return { status: 0, bytes: Buffer.alloc(0) }
        }
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
