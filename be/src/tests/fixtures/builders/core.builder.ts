import { EnvSource } from "@modules/platform/config"
import { PRIMARY_DATA_SOURCE } from "@modules/platform/database"
import { ACCESS_TOKEN_VERIFIER } from "@modules/domain/identity"
import { OBJECT_STORAGE } from "@modules/integrations/object-storage"
import { OWN_TOKEN_VERIFIER } from "@modules/integrations/passport"
import { readCoreEnv } from "../../../../apps/core/src/core.env"

/** What a wiring proof hands the compiled root: public options and the infrastructure doubles. */
export interface WiringProof {
    readonly options: Readonly<Record<string, unknown>>
    readonly overrides: ReadonlyArray<{ readonly token: unknown; readonly value: unknown }>
}

/** The public fixture environment of the core proof: no secret, no network; the same values `hfs.json` declares for the core boot entry. */
export const CORE_PROOF_ENV: Readonly<Record<string, string>> = {
    PORT: "3000",
    REALTIME_HUB: "memory",
    HTTP_SECURITY_ALLOWED_ORIGINS: "https://fixture.example",
    PRIMARY_DB_URL: "postgresql://app_be@127.0.0.1:5432/postgres",
    PRIMARY_DB_SCHEMA: "public",
    AUTH_JWT_ISSUER: "https://api.fixture.example",
    AUTH_JWT_PRIVATE_KEY: "fixture-only",
    AUTH_WEB_ORIGIN: "https://app.fixture.example",
    STORAGE_ENDPOINT: "http://127.0.0.1:9000",
    STORAGE_REGION: "us-east-1",
    STORAGE_BUCKET: "fixture",
    STORAGE_ACCESS_KEY_ID: "fixture-key-id",
    STORAGE_SECRET_ACCESS_KEY: "fixture-only-value",
    MAIL_HOST: "127.0.0.1",
    MAIL_FROM_NAME: "Fixture",
    MAIL_FROM: "fixture@fixture.example",
}

/** Compiles the real core root with the options its own environment parser reads from the fixture environment, and explicit infrastructure doubles. */
export const buildWiringProof = (): WiringProof => ({
    options: { ...readCoreEnv(new EnvSource(CORE_PROOF_ENV)) },
    overrides: [
        { token: PRIMARY_DATA_SOURCE, value: { manager: {}, driver: {} } },
        { token: OBJECT_STORAGE, value: {} },
        { token: OWN_TOKEN_VERIFIER, value: () => ({ ok: false }) },
        { token: ACCESS_TOKEN_VERIFIER, value: () => ({ ok: false }) },
    ],
})
