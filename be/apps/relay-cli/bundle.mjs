// Bundles the tsc output of the learner CLI (`npm run build:relay-cli` runs tsc and tsc-alias first; `prepack` runs this) into the one file the
// `@starci/next-relay` package ships. esbuild reads no decorator metadata, so it bundles tsc's JavaScript, never the TypeScript.
import { build } from "esbuild"
import { chmodSync, mkdirSync, readFileSync, rmSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const { version } = JSON.parse(readFileSync(resolve(here, "package.json"), "utf8"))
const outDir = resolve(here, "dist/bundle")
const outFile = resolve(outDir, "starci-relay.cjs")

/** Packages Nest and the sockets load only when a feature that needs them is on; the CLI turns none of them on. */
const OPTIONAL_PACKAGES = [
    "@nestjs/microservices",
    "@nestjs/websockets",
    "@nestjs/platform-express",
    "@nestjs/platform-fastify",
    "class-transformer",
    "class-validator",
    "bufferutil",
    "utf-8-validate",
    "@fig/complete-commander",
    "typescript",
]

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })
await build({
    entryPoints: [resolve(here, "dist/apps/relay-cli/src/main.js")],
    outfile: outFile,
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node22",
    external: OPTIONAL_PACKAGES,
    define: { __RELAY_VERSION__: JSON.stringify(version) },
    banner: { js: "#!/usr/bin/env node" },
    legalComments: "none",
    logLevel: "warning",
})
chmodSync(outFile, 0o755)
