import { Query } from "@nestjs/cqrs"
import type { HarnessDoctorView } from "@modules/domain/harness"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { HarnessDoctorRequest } from "./harness.contracts"

/** Asks for the doctor probes of one tool with the newest result of each. */
export class GetHarnessDoctorQuery extends Query<HarnessDoctorView> {
    constructor(readonly params: ExecuteParams<HarnessDoctorRequest>) {
        super()
    }
}
