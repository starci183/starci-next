/**
 * The declaration of the test world: selection and overrides only. The service list and the image versions come from the stack
 * definition (`.starcistacks/dev`); the library runs the Postgres of every connection real behind toxiproxy, migrates it once per
 * run through the cli app and boots the api apps in process. `useSandbox` is the custody read of a live spec: it names the
 * environment keys its sandbox needs and the library resolves their values itself, so a spec declares names and never reads
 * the environment or holds a value.
 */
import { defineTestWorld } from "@starci/test-world"
import { AppModule as CliApp } from "../../../apps/cli/src/app.module"
import { AppModule as CoreApp } from "../../../apps/core/src/app.module"
import { cliOptionsOf, coreOptionsOf, migrateCli, platformBase } from "./test-apps.options"

export const { useTestWorld, useSandbox } = defineTestWorld({
    stack: ".starcistacks/dev",
    stacks: {
        postgresql: { connections: [{ name: "primary" }] },
    },
    apps: {
        core: { module: CoreApp, options: coreOptionsOf },
        cli: { module: CliApp, options: cliOptionsOf, listen: false },
    },
    migrate: { module: migrateCli, options: cliOptionsOf },
    modules: { base: platformBase },
})
