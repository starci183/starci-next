import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { homedir, platform } from "node:os"
import { dirname } from "node:path"
import type { ConfigEnv } from "./relay-client.config"
import type { ServiceHost } from "./service.policy"

/** The settings a started relay must keep: only those this shell set. */
const kept = (env: ConfigEnv): Record<string, string> => {
    const entries: Array<[string, string | undefined]> = [
        ["STARCI_NEXT_HOME", env.STARCI_NEXT_HOME],
        ["STARCI_NEXT_URL", env.STARCI_NEXT_URL],
    ]
    return Object.fromEntries(entries.filter((entry): entry is [string, string] => entry[1] !== undefined))
}

/** This machine as the start-at-login host: its home, its Node and bundled script, its files and its shell. */
export const nodeServiceHost = (env: ConfigEnv, shell: (command: string) => Promise<number>): ServiceHost => ({
    platform: platform(),
    home: homedir(),
    appData: process.env.APPDATA,
    uid: typeof process.getuid === "function" ? process.getuid() : undefined,
    nodePath: process.execPath,
    scriptPath: __filename,
    env: kept(env),
    write: (path, content) => {
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, content, "utf8")
    },
    remove: (path) => rmSync(path, { force: true }),
    exists: (path) => existsSync(path),
    shell,
})
