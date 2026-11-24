import type { CliIo, PairingStarted } from "./relay-client.contracts"
import { clearConfig, readConfig, writeConfig } from "./device-settings.adapter"
import { registerDeviceKey } from "./device-key.cli"
import { isRecord } from "./json.mapper"
import { pollToken, refusalLine, startPairing } from "./relay-api.client"
import { CLAIM_PAIR_CODE_MUTATION, relayGraphql } from "./relay-graphql.client"

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
        await registerDeviceKey(io, { baseUrl, token: poll.deviceToken })
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

/** The six digits of a pair code the learner copied from the web (a space or a dash between the digits is dropped), or null. */
export const pairCodeOf = (typed: string): string | null => {
    const compact = typed.replaceAll(/[\s-]/gu, "")
    return /^\d{6}$/u.test(compact) ? compact : null
}

/**
 * `starci-relay pair <code>`: claims the six-digit pair code the learner got on the web for this machine, stores the device token like
 * `login` does and registers a new device key. The call carries no token (there is none yet) and the token is never printed.
 */
export const pairCommand = async (io: CliIo, code: string): Promise<number> => {
    const digits = pairCodeOf(code)
    if (digits === null) {
        io.err("Mã ghép là 6 chữ số. Hãy lấy mã trên trang Thiết bị của StarCi rồi chạy lại: starci-relay pair <mã>")
        io.err(
            "A pair code is six digits. Get one on the Devices page of StarCi and run again: starci-relay pair <code>",
        )
        return 1
    }
    const { baseUrl } = readConfig(io.env)
    const answer = await relayGraphql(io.fetch, baseUrl, undefined, CLAIM_PAIR_CODE_MUTATION, {
        input: {
            code: digits,
            deviceName: io.hostName().slice(0, 60) || "my-machine",
            platform: platformName(io.platform()),
        },
    })
    if (answer.kind === "refused") {
        io.err(
            answer.status === 0
                ? refusalLine(answer)
                : `Pairing refused (${answer.code}). Get a new code and run starci-relay pair again.`,
        )
        return 1
    }
    const claimed = answer.data.claimRelayPairCode
    const deviceToken = isRecord(claimed) ? claimed.deviceToken : undefined
    if (typeof deviceToken !== "string" || deviceToken === "") {
        io.err("StarCi answered without a device token. Get a new code and run starci-relay pair again.")
        return 1
    }
    writeConfig(io.env, { baseUrl, deviceToken })
    io.out("This machine is connected to StarCi.")
    await registerDeviceKey(io, { baseUrl, token: deviceToken })
    return 0
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
