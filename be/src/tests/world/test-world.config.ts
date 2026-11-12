/**
 * The declaration of the test world: selection and overrides only. The service list and the image versions come from the stack
 * definition (`.starcistacks/dev`); the library runs the Postgres of every connection real behind toxiproxy, migrates it once per
 * run through the cli app and boots the api apps in process.
 */
import { defineTestWorld, type TestWorldApi } from "@starci/test-world"
import { judge0Fake } from "./fakes/judge0/judge0.client"
import { oidcIssuerFake } from "./fakes/oidc-issuer/oidc-issuer.client"
import { openrouterFake } from "./fakes/openrouter/openrouter.client"
import { payosFake } from "./fakes/payos/payos.client"
import { AppModule as CoreApp } from "../../../apps/core/src/app.module"
import { cliOptionsOf, coreOptionsOf, migrateCli, platformBase } from "./test-apps.options"

const world: TestWorldApi = defineTestWorld({
    stack: ".starcistacks/dev",
    stacks: {
        postgresql: { connections: [{ name: "primary" }] },
        mail: {},
    },
    fakes: { idp: oidcIssuerFake(), payos: payosFake(), openrouter: openrouterFake(), judge0: judge0Fake() },
    apps: {
        core: { module: CoreApp, options: coreOptionsOf, rawBody: true },
    },
    migrate: { module: migrateCli, options: cliOptionsOf },
    modules: { base: platformBase },
})

/** Registers the hooks that boot and close the world around a spec and answers its handle; call it inside `describe`. */
export const useTestWorld: TestWorldApi["useTestWorld"] = world.useTestWorld

/** The contract layer: the real integration client against a provider sandbox, in a `contract-spec`. */
export const useSandbox: TestWorldApi["useSandbox"] = world.useSandbox
