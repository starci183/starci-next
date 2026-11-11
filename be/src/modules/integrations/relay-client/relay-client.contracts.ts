import type { ConfigEnv } from "./relay-client.config"

/** One request the CLI makes: always a JSON POST to a StarCi door. */
export interface FetchInit {
    /** The HTTP method (POST for every StarCi door the CLI calls). */
    readonly method: string
    /** The request headers: the JSON content type, and the device bearer on the relay. */
    readonly headers: Readonly<Record<string, string>>
    /** The JSON body. */
    readonly body: string
}

/** What a StarCi door answered: its status (0 when no answer came) and its body text. */
export interface FetchAnswer {
    /** The HTTP status, or 0 when StarCi could not be reached. */
    readonly status: number
    /** The body text, empty when there is none. */
    readonly text: string
    /** Why no answer came, when the status is 0. */
    readonly cause?: unknown
}

/** The fetch the CLI makes its calls with. It never rejects: an unreachable StarCi answers status 0 with the cause. */
export type Fetcher = (url: string, init: FetchInit) => Promise<FetchAnswer>

/** What running one check on this machine answered. */
export interface CheckRun {
    /** The exit code of the command; -1 when it could not start or was stopped. */
    readonly exitCode: number
    /** Its standard output and error, as printed. */
    readonly output: string
    /** How long it ran, in milliseconds. */
    readonly durationMs: number
}

/** Everything the CLI touches outside itself, injected so a spec drives it. */
export interface CliIo {
    /** The CLI settings of the environment. */
    readonly env: ConfigEnv
    /** Prints one line to the standard output. */
    readonly out: (line: string) => void
    /** Prints one line to the standard error. */
    readonly err: (line: string) => void
    /** Calls a StarCi door. */
    readonly fetch: Fetcher
    /** Waits `ms` milliseconds. */
    readonly sleep: (ms: number) => Promise<void>
    /** The current instant, in epoch milliseconds. */
    readonly now: () => number
    /** A fresh client event id (a UUID). */
    readonly ids: () => string
    /** The host name of this machine. */
    readonly hostName: () => string
    /** The Node platform name of this machine. */
    readonly platform: () => string
    /** Asks the learner a yes/no question in the terminal. */
    readonly confirm: (question: string) => Promise<boolean>
    /** Sets the exit code of this process, which ends with it once the command returns. */
    readonly exit: (code: number) => void
    /** Verifies a signed manifest payload with the StarCi public key (PEM). */
    readonly verify: (payload: string, signature: string, publicKeyPem: string) => ManifestRead
    /** Runs one shown and confirmed command in a folder of the task workspace, stopped after its timeout. */
    readonly runCommand: (command: string, cwd: string, timeoutMs: number) => Promise<CheckRun>
}

/** The machine a pairing is started for. */
export interface PairingDevice {
    /** The name the learner sees on the devices page. */
    readonly deviceName: string
    /** The platform the relay knows: windows, macos or linux. */
    readonly platform: string
}

/** A pairing just started by the device-start door. */
export interface PairingStarted {
    /** The secret code this machine polls the token with. */
    readonly deviceCode: string
    /** The short code the learner enters on the web. */
    readonly userCode: string
    /** The page the learner confirms this machine on. */
    readonly verifyUrl: string
    /** When the codes lapse (ISO 8601). */
    readonly expiresAt: string
}

/** A door's refusal: its stable code and HTTP status (status 0: StarCi could not be reached). */
export interface Refusal {
    /** The refusal tag. */
    readonly kind: "refused"
    /** The stable error code of the door. */
    readonly code: string
    /** The HTTP status, 0 when no answer came. */
    readonly status: number
}

/** What the device-start door answered. */
export type PairingStart = { readonly kind: "started"; readonly pairing: PairingStarted } | Refusal

/** What one device-token poll answered: the token, still pending, or refused with a stable code. */
export type TokenPoll =
    { readonly kind: "token"; readonly deviceToken: string } | { readonly kind: "pending" } | Refusal

/** What one relay GraphQL operation answered: its data, or the refusal of its first error. */
export type GraphqlAnswer = { readonly kind: "data"; readonly data: Readonly<Record<string, unknown>> } | Refusal

/** One allowlisted check of a signed manifest. */
export interface ManifestCheck {
    /** The check id the result is filed under. */
    readonly id: string
    /** The command shown to the learner and run once confirmed. */
    readonly command: string
    /** The folder of the task workspace it runs in (relative, never above it). */
    readonly cwd: string
    /** When it is stopped, in milliseconds. */
    readonly timeoutMs: number
}

/** What a project run adds to a signed manifest: the milestone, the JUnit report to read and the concepts that count. */
export interface ManifestPlan {
    /** The milestone the learner runs. */
    readonly milestone: string
    /** The JUnit XML report the test command writes, relative to the project folder. */
    readonly report: string
    /** The concepts of the milestone: only tests tagged with one of them are reported. */
    readonly concepts: ReadonlyArray<string>
}

/** The verified body of a signed manifest: only what the signature covers is ever read. */
export interface VerifiedManifest {
    /** The manifest id the ack names. */
    readonly manifestId: string
    /** The task the manifest is for. */
    readonly taskId: string
    /** The checks to run, in order. */
    readonly checks: ReadonlyArray<ManifestCheck>
    /** The plan of a project run, absent for a plain task. */
    readonly plan?: ManifestPlan
}

/** What verifying a manifest answered: the verified body, or why it was rejected. */
export type ManifestRead =
    | { readonly kind: "verified"; readonly manifest: VerifiedManifest }
    | { readonly kind: "rejected"; readonly cause: unknown }

/** What fetching a task's manifest answered: verified, not signed by StarCi, or refused by the relay. */
export type ManifestFetch =
    { readonly kind: "verified"; readonly manifest: VerifiedManifest } | { readonly kind: "unsigned" } | Refusal

/** The upload mutations of the relay app. */
export type UploadMutation = "relayCheckStarted" | "relayCheckResult" | "relayLog" | "relayManifestAck"

/** One upload waiting for StarCi to accept it, idempotent on its client event id. */
export interface PendingUpload {
    /** The relay mutation it is sent with. */
    readonly mutation: UploadMutation
    /** The mutation input, its client event id included. */
    readonly input: Readonly<Record<string, unknown>> & { readonly eventId: string }
}

/** What reading a JSON text answered: the parsed value, or the parse failure as the cause. */
export type JsonRead =
    { readonly kind: "read"; readonly value: unknown } | { readonly kind: "unreadable"; readonly cause: unknown }

/** What checking a signature answered: whether it holds, or why it could not be checked (an unreadable key or signature). */
export type SignatureRead =
    { readonly kind: "checked"; readonly holds: boolean } | { readonly kind: "rejected"; readonly cause: unknown }

/** The part of the outside world that is this terminal and this operating system. */
export type TerminalPort = Pick<CliIo, "out" | "err" | "hostName" | "platform" | "exit" | "confirm" | "runCommand">
