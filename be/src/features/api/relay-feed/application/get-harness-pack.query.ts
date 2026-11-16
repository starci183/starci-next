import { Query } from "@nestjs/cqrs"
import type { HarnessPack } from "@modules/domain/harness"
import type { DevicePrincipal } from "@modules/domain/relay"
import type { PublicExecuteParams } from "@modules/platform/cqrs"

/** The device that asks and the harness pack it pulls: a build, a doctor tool or a trap, by its key. */
export interface GetHarnessPackRequest {
    /** The paired device the tool-token credential proved. */
    readonly device: DevicePrincipal
    /** Which pack: a build tarball, the probe files of a tool or a trap folder. */
    readonly kind: "build" | "doctor-pack" | "trap"
    /** The build id, the tool or the trap id. */
    readonly key: string
}

/** Asks for the tarball of one live harness pack, for a paired device; /harness is free, so no entitlement is asked. */
export class GetHarnessPackQuery extends Query<HarnessPack> {
    constructor(readonly params: PublicExecuteParams<GetHarnessPackRequest>) {
        super()
    }
}
