import type { Principal } from "@modules/platform/cqrs"
import type { CredentialPrincipal } from "./credential.contracts"

/** The signed-in learner as the doors read it: the verified account id (the learner id), its roles, name and email. */
export interface IdentityPrincipal {
    /** The account id from the verified access token's `sub`: the learner id every domain keys on. */
    readonly subject: string
    /** The roles of the account (`raw_user_meta_data.roles`); no entitlement is inferred from them. */
    readonly roles: ReadonlyArray<string>
    /** The name the header shows (the account's `full_name`), or null. */
    readonly displayName: string | null
    /** The account's email, or null. */
    readonly email: string | null
}

declare module "express-serve-static-core" {
    /** The request carries the separate principals established by the identity guards. */
    interface Request {
        /** The identity `CredentialGuard` authenticated on a door marked `@Credential`; never a session principal. */
        credentialPrincipal?: CredentialPrincipal
        /** The authenticated caller (verified access token, account standing), when the door is not public. */
        principal?: Principal
        /** The same caller with the roles and name of the account, as the doors read it. */
        identityPrincipal?: IdentityPrincipal
    }
}

/** Why a door is open to anonymous callers; the vocabulary is closed. */
export enum PublicReason {
    /** Liveness and readiness probes. */
    Health = "health",
    /** The authentication protocol's anonymous handshake. */
    AuthHandshake = "auth-handshake",
    /** A webhook whose signature is verified before its domain intake runs. */
    SignedWebhook = "signed-webhook",
    /** A declared public catalog read. */
    CatalogRead = "catalog-read",
    /** A protocol door that proves its own caller: it verifies the learner's bearer access token before any read or act (the MCP endpoint). */
    ProtocolBearer = "protocol-bearer",
    /** The sink of a server probe: its unguessable per-run id is the capability, open only while that run waits. */
    ProbeSink = "probe-sink",
    /**
     * A read of free content that a guest may make: the door takes the session when the request carries a valid one and answers
     * as a guest (no principal) when it does not. It never creates a session and never answers a learner's private data.
     */
    GuestRead = "guest-read",
}

/** The metadata `@Public` attaches to a door. */
export interface PublicMetadata {
    /** Why the door is anonymous. */
    readonly reason: PublicReason
}

/** What identity admission returns to the guard. */
export type IdentityAdmission = Principal | CredentialPrincipal | PublicReason
