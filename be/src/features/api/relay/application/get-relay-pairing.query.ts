import { Query } from "@nestjs/cqrs"
import type { PairingPreview } from "@modules/domain/relay"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetRelayPairingRequest } from "./get-relay-pairing.contracts"

/** Reads what the learner confirms: the device name and platform of a pending pairing. */
export class GetRelayPairingQuery extends Query<PairingPreview> {
    constructor(readonly params: ExecuteParams<GetRelayPairingRequest>) {
        super()
    }
}
