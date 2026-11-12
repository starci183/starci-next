/**
 * The typed options the test world hands to the real apps, the migrate step and the platform base of a modules world: what the
 * `main.ts` of each app parses from the environment of a deployment, built from the wiring of the run. The databases are the real
 * ones the library runs; the migrate step is the cli app's own migration runner, the one `cli migrate run` calls.
 */
import type { DynamicModule } from "@nestjs/common"
import { randomBytes } from "node:crypto"
import { NestFactory } from "@nestjs/core"
import type { WorldWiring } from "@starci/test-world"
import { AI_GATEWAY_KEY_ENV } from "@modules/integrations/ai-gateway"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { DatabaseModule, MigrationRunnerService } from "@modules/platform/database"
import { parseHttpSecurityConfig, type HttpSecurityOptions } from "@modules/platform/http-security"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import { OIDC_FAKE_CLIENT_ID, oidcIssuerOf } from "./fakes/oidc-issuer/oidc-issuer.client"
import { AppModule as CliApp } from "../../../apps/cli/src/app.module"
import { readCliEnv } from "../../../apps/cli/src/cli.env"
import { createCliAppOptions, type CliAppOptions } from "../../../apps/cli/src/cli.options"
import { readCoreEnv } from "../../../apps/core/src/core.env"
import type { CoreOptions } from "../../../apps/core/src/core.options"

/** The wiring of the world: its api apps and its database connections. */
export type AppWiring = WorldWiring<"core", "primary">

/** The one browser origin the apps of the world accept. */
export const ALLOWED_ORIGIN = "http://localhost:3000"

/** The registered callback page of the social flow, as the identity client registers it. */
const SOCIAL_CALLBACK_URI = "https://app.test/sign-in/callback"

/** The sealing secret of the identity worlds, generated for the run so no secret literal exists. */
const IDENTITY_TEST_ENCRYPTION_KEY = randomBytes(32).toString("base64url")

/** The SePay IPN secret key the core app of the world holds, generated for the run: a delivery proves itself with it in `x-secret-key`. */
export const SEPAY_IPN_SECRET: string = randomBytes(24).toString("base64url")

/** The environment a deployment hands every app of the run: its mode, its origin allowlist and the URL of every connection. */
const environmentOf = (w: AppWiring, extra: Readonly<Record<string, string>> = {}): EnvSource =>
    new EnvSource({
        NODE_ENV: "test",
        HTTP_SECURITY_ALLOWED_ORIGINS: ALLOWED_ORIGIN,
        PRIMARY_DB_URL: w.db.primary.url,
        MAIL_HOST: w.mail.host,
        MAIL_PORT: String(w.mail.port),
        MAIL_SECURITY: "none",
        MAIL_FROM: "no-reply@starci.test",
        MAIL_FROM_NAME: "StarCi",
        IDENTITY_KEYCLOAK_ISSUER: oidcIssuerOf(w.fake.idp?.url ?? ""),
        IDENTITY_KEYCLOAK_CLIENT_ID: OIDC_FAKE_CLIENT_ID,
        IDENTITY_KEYCLOAK_CLIENT_SECRET_FILE: "/run/secrets/keycloak-client-secret",
        IDENTITY_KEYCLOAK_CLIENT_SECRET: w.fake.idp?.values.clientSecret ?? "",
        IDENTITY_SOCIAL_CALLBACK_URI: SOCIAL_CALLBACK_URI,
        IDENTITY_SESSION_ENCRYPTION_KEY: IDENTITY_TEST_ENCRYPTION_KEY,
        SEPAY_IPN_SECRET_KEY: SEPAY_IPN_SECRET,
        SEPAY_MERCHANT_ID: "SP-E2E-MERCHANT",
        SEPAY_SIGNING_SECRET_KEY: randomBytes(24).toString("base64url"),
        SEPAY_CHECKOUT_URL: "https://sandbox.pay.sepay.test/v1/checkout/init",
        [AI_GATEWAY_KEY_ENV]: randomBytes(24).toString("base64url"),
        AI_GATEWAY_BASE_URL: w.fake.openrouter?.url ?? "",
        PRACTICE_SUBMISSIONS_PER_MINUTE: "5",
        ...(w.fake.judge0 === undefined
            ? {}
            : { JUDGE0_BASE_URL: w.fake.judge0.url, JUDGE0_AUTH_TOKEN: w.fake.judge0.values.authToken ?? "" }),
        ...(w.fake.idp?.ca === undefined ? {} : { HTTP_TRUSTED_CA: w.fake.idp.ca }),
        ...extra,
    })

/**
 * The core app (its doors, the device socket and the upload GraphQL), read the way its `main.ts` reads its environment, listening
 * on the port the run reserved for it; the memory hub, one replica.
 */
export const coreOptionsOf = (w: AppWiring): CoreOptions =>
    readCoreEnv(environmentOf(w, { PORT: String(w.apps.core.port), REALTIME_HUB: "memory" }))

/** The origin allowlist and rate limits of the run, read the way the api apps read them. */
export const httpSecurityOf = (w: AppWiring): HttpSecurityOptions => parseHttpSecurityConfig(environmentOf(w))

/** The cli app over the run's databases, read the way its `main.ts` reads its environment. */
export const cliOptionsOf = (w: AppWiring): CliAppOptions => createCliAppOptions(readCliEnv(environmentOf(w)))

/** The migrate step of the run: the cli app composed over the run's databases, running the migrations of every connection. */
export const migrateCli = async (options: CliAppOptions): Promise<void> => {
    const cli = await NestFactory.createApplicationContext(CliApp.register(options), { logger: false })
    try {
        await cli.get(MigrationRunnerService).run()
    } finally {
        await cli.close()
    }
}

/** The platform base of a modules world: the clock, the timer, the logger and the database over the run's connections. */
export const platformBase = (w: AppWiring): ReadonlyArray<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [{ ...cliOptionsOf(w).database, entities: [], migrations: [] }],
    }),
]
