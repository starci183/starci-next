import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import { isRecord, jsonOf } from "./json.mapper"
import { DEFAULT_BASE_URL, type CliConfig, type ConfigEnv } from "./relay-client.config"

/** The config file of this user. */
export const configPathOf = (env: ConfigEnv): string =>
    join(env.STARCI_NEXT_HOME ?? join(homedir(), ".starci-next"), "config.json")

/** The stored config, or the default one when the file is missing or unreadable; `STARCI_NEXT_URL` wins over the file. */
export const readConfig = (env: ConfigEnv): CliConfig => {
    const path = configPathOf(env)
    const read = existsSync(path) ? jsonOf(readFileSync(path, "utf8")) : null
    const stored = read?.kind === "read" && isRecord(read.value) ? read.value : {}
    const baseUrl = env.STARCI_NEXT_URL ?? (typeof stored.baseUrl === "string" ? stored.baseUrl : DEFAULT_BASE_URL)
    const token = stored.deviceToken
    return typeof token === "string" ? { baseUrl, deviceToken: token } : { baseUrl }
}

/** Writes the config readable by this user alone (0600), the folder created if needed. */
export const writeConfig = (env: ConfigEnv, config: CliConfig): void => {
    const path = configPathOf(env)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
    chmodSync(path, 0o600)
}

/** Forgets the stored config, the device token with it. */
export const clearConfig = (env: ConfigEnv): void => {
    rmSync(configPathOf(env), { force: true })
}
