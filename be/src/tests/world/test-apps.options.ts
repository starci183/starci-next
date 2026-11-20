/**
 * The typed options the test world hands to the real apps, the migrate step and the platform base of a modules world: what the
 * `main.ts` of each app parses from the environment of a deployment, built from the wiring of the run. The databases are the real
 * ones the library runs; the migrate step is `migrate.ts`, which applies the same db files the harness applies.
 */
import type { DynamicModule } from "@nestjs/common"
import { generateKeyPairSync, randomBytes } from "node:crypto"
import type { WorldWiring } from "@starci/test-world"
import { AI_GATEWAY_KEY_ENV } from "@modules/integrations/ai-gateway"
import { parsePassportConfig, type PassportOptions } from "@modules/integrations/passport"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { DatabaseModule } from "@modules/platform/database"
import { PRIMARY_ENTITIES } from "@modules/platform/database/entities"
import { parseHttpSecurityConfig, type HttpSecurityOptions } from "@modules/platform/http-security"
import { LoggingModule } from "@modules/platform/logging"
import { RetryModule } from "@modules/platform/retry"
import { readCliEnv } from "../../../apps/cli/src/cli.env"
import { createCliAppOptions, type CliAppOptions } from "../../../apps/cli/src/cli.options"
import { readCoreEnv } from "../../../apps/core/src/core.env"
import type { CoreOptions } from "../../../apps/core/src/core.options"
import { WORLD_BUCKET } from "./object-storage-world.options"

/** The wiring of the world: its api apps and its database connections. */
export type AppWiring = WorldWiring<"core", "primary">

/** The one browser origin the apps of the world accept. */
export const ALLOWED_ORIGIN = "http://localhost:3000"

/** The signing key of the app's own access tokens, generated for the run so no key literal exists. */
const AUTH_JWT_PRIVATE_KEY = generateKeyPairSync("ed25519")
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString()

/** The SePay IPN secret key the core app of the world holds, generated for the run: a delivery proves itself with it in `x-secret-key`. */
export const SEPAY_IPN_SECRET: string = randomBytes(24).toString("base64url")

/** The environment a deployment hands every app of the run: its mode, its origin allowlist and the URL of every connection. */
const environmentOf = (w: AppWiring, extra: Readonly<Record<string, string>> = {}): EnvSource =>
    new EnvSource({
        NODE_ENV: "test",
        HTTP_SECURITY_ALLOWED_ORIGINS: [ALLOWED_ORIGIN, ...Object.values(w.apps).map((app) => app.url)].join(","),
        PRIMARY_DB_URL: w.db.primary.url,
        MAIL_HOST: w.mail.host,
        MAIL_PORT: String(w.mail.port),
        MAIL_SECURITY: "none",
        MAIL_FROM: "no-reply@starci.test",
        MAIL_FROM_NAME: "StarCi",
        PRIMARY_DB_SCHEMA: "public",
        AUTH_JWT_ISSUER: ALLOWED_ORIGIN,
        AUTH_WEB_ORIGIN: ALLOWED_ORIGIN,
        AUTH_JWT_AUDIENCE: "starci-next",
        AUTH_JWT_KEY_ID: "world-1",
        AUTH_JWT_PRIVATE_KEY: AUTH_JWT_PRIVATE_KEY,
        STORAGE_ENDPOINT: w.minio.endpoint,
        STORAGE_REGION: "us-east-1",
        STORAGE_BUCKET: w.minio.bucket(WORLD_BUCKET),
        STORAGE_ACCESS_KEY_ID: w.minio.accessKey,
        STORAGE_SECRET_ACCESS_KEY: w.minio.secretKey,
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

/** The sign-in settings of the run, read the way the core app reads them: its own issuer, the generated signing key and the world web origin. */
export const passportOptionsOf = (w: AppWiring): PassportOptions => parsePassportConfig(environmentOf(w))

/** The cli app over the run's databases, read the way its `main.ts` reads its environment. */
export const cliOptionsOf = (w: AppWiring): CliAppOptions => createCliAppOptions(readCliEnv(environmentOf(w)))

/** The platform base of a modules world: the clock, the timer, the logger and the database over the run's connections. */
export const platformBase = (w: AppWiring): ReadonlyArray<DynamicModule> => [
    ClockModule.register({ isGlobal: true }),
    RetryModule.register({ isGlobal: true }),
    LoggingModule.register({ isGlobal: true }),
    DatabaseModule.register({
        isGlobal: true,
        connections: [cliOptionsOf(w).database],
        entities: PRIMARY_ENTITIES,
    }),
]
