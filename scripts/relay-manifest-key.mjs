// Makes the development Ed25519 key pair the relay signs task manifests with, so the learner CLI can verify them.
// Run once per machine before `starci app stack up --env dev`: node scripts/relay-manifest-key.mjs [--dir <folder>]
// The private key (manifest-signing.pem) is read by the relay as RELAY_MANIFEST_SIGNING_KEY_FILE; the public key
// (manifest-public.pem) is what the CLI verifies with: export STARCI_NEXT_MANIFEST_KEY="$(cat <dir>/manifest-public.pem)".
// Development only: a production relay gets a sealed key. Nothing here is a secret of the product, and nothing is printed but paths.
import { generateKeyPairSync } from "node:crypto"
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const flag = process.argv.indexOf("--dir")
const stateRoot =
    process.platform === "win32"
        ? join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "starci-harness", "state")
        : join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"), "starci-harness", "state")
const dir =
    flag > 0 && process.argv[flag + 1]
        ? process.argv[flag + 1]
        : join(stateRoot, "stack", "starci-next-dev", "dev", "data", "relay-dev")
const privatePath = join(dir, "manifest-signing.pem")
const publicPath = join(dir, "manifest-public.pem")

if (existsSync(privatePath)) {
    console.log(`The key pair already exists: ${privatePath}`)
} else {
    mkdirSync(dir, { recursive: true })
    const { privateKey, publicKey } = generateKeyPairSync("ed25519")
    writeFileSync(privatePath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 })
    writeFileSync(publicPath, publicKey.export({ type: "spki", format: "pem" }))
    console.log(`Wrote ${privatePath} and ${publicPath}`)
}
console.log(`CLI: export STARCI_NEXT_MANIFEST_KEY="$(cat '${publicPath}')"`)
