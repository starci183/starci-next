import { Query } from "@nestjs/cqrs"
import type { SignedManifest } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { GetRelayManifestRequest } from "./get-relay-manifest.contracts"

/** Asks for the signed manifest of a task, for the device the token proved. */
export class GetRelayManifestQuery extends Query<SignedManifest> {
    constructor(readonly params: PublicExecuteParams<GetRelayManifestRequest>) {
        super()
    }
}
