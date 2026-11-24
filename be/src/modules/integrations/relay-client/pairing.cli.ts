import type { CliIo, PairingStarted } from "./relay-client.contracts"
import { clearConfig, readConfig, writeConfig } from "./device-settings.adapter"
import { pollToken, refusalLine, startPairing } from "./relay-api.client"

/** How often the login asks for the token while the learner confirms on the web. */
const POLL_INTERVAL_MS = 3000

/** The platform name the relay knows for this operating system. */
export const platformName = (nodePlatform: string): string => {
    if (nodePlatform === "win32") return "windows"
    if (nodePlatform === "darwin") return "macos"
    return "linux"
}

/** Polls for the token until the learner confirmed, the code was refused, or it lapsed. */
const waitForToken = async (io: CliIo, baseUrl: string, pairing: PairingStarted): Promise<number> => {
    if (io.now() >= Date.parse(pairing.expiresAt)) {
        io.err("The code expired before it was confirmed (RELAY_CODE_NOT_FOUND). Run starci-relay login again.")
        return 1
    }
    const poll = await pollToken(io.fetch, baseUrl, pairing.deviceCode)
    if (poll.kind === "token") {
        writeConfig(io.env, { baseUrl, deviceToken: poll.deviceToken })
        io.out("This machine is connected to StarCi.")
        return 0
    }
    if (poll.kind === "refused") {
        io.err(poll.status === 0 ? refusalLine(poll) : `Pairing refused (${poll.code}). Run starci-relay login again.`)
        return 1
    }
    await io.sleep(POLL_INTERVAL_MS)
    return waitForToken(io, baseUrl, pairing)
}

/** Pairs this machine: prints the code and the page, then waits for the learner to confirm it on the web. */
export const loginCommand = async (io: CliIo): Promise<number> => {
    const config = readConfig(io.env)
    const started = await startPairing(io.fetch, config.baseUrl, {
        deviceName: io.hostName().slice(0, 60) || "my-machine",
        platform: platformName(io.platform()),
    })
    if (started.kind === "refused") {
        io.err(refusalLine(started))
        return 1
    }
    io.out(`Open ${started.pairing.verifyUrl} and enter the code: ${started.pairing.userCode}`)
    io.out("Waiting for you to confirm this machine on the web...")
    return waitForToken(io, config.baseUrl, started.pairing)
}

/** What `status` reports besides the config: the build and whether Relay starts by itself at login. */
export interface StatusFacts {
    /** The version of this build. */
    readonly version: string
    /** Whether the start-at-login file of this user exists. */
    readonly isServiceOn: boolean
}

/** Prints, in Vietnamese, the version, where StarCi is, whether this machine holds a device token and whether Relay starts at login. */
export const statusCommand = (io: CliIo, facts: StatusFacts): number => {
    const config = readConfig(io.env)
    io.out(`StarCi Relay ${facts.version}`)
    io.out(`Máy chủ StarCi: ${config.baseUrl}`)
    io.out(
        config.deviceToken === undefined
            ? "Máy này chưa được nối với tài khoản. Chạy: starci-relay login"
            : "Máy này đã được nối với tài khoản StarCi.",
    )
    io.out(
        facts.isServiceOn
            ? "Tự chạy khi đăng nhập: đang bật (starci-relay uninstall-service để tắt)."
            : "Tự chạy khi đăng nhập: chưa bật (starci-relay install-service để bật).",
    )
    return 0
}

/** `starci-relay` alone or with `--version`: the version, or the way to the help. */
export const rootCommand = (io: CliIo, isVersion: boolean, version: string): number => {
    io.out(isVersion ? version : `StarCi Relay ${version}. Chạy starci-relay --help để xem các lệnh.`)
    return 0
}

/** Forgets the device token; revoking the device for good happens on the devices page. */
export const logoutCommand = (io: CliIo): number => {
    const config = readConfig(io.env)
    clearConfig(io.env)
    io.out(`This machine forgot its token. Revoke it for good at ${config.baseUrl}/devices.`)
    return 0
}

/** Points at the devices page, where the learner sees and revokes paired devices. */
export const devicesCommand = (io: CliIo): number => {
    io.out(`Your paired devices: ${readConfig(io.env).baseUrl}/devices`)
    return 0
}
