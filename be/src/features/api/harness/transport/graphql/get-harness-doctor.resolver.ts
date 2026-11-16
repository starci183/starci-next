import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessDoctorQuery } from "../../application/get-harness-doctor.query"
import { HarnessDoctorInput } from "./dto/harness-doctor.input"
import { HarnessDoctorType } from "./dto/harness-doctor.type"
import { toHarnessDoctorType, toHarnessDoctorParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the doctor probes of one tool with the newest result of each; it needs a session and no Premium. */
export class GetHarnessDoctorResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the doctor probes of one tool with the newest result of each. */
    @Query(() => HarnessDoctorType, { name: "harnessDoctor" })
    async harnessDoctor(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: HarnessDoctorInput,
    ): Promise<HarnessDoctorType> {
        const result = await this.queryBus.execute(new GetHarnessDoctorQuery(toHarnessDoctorParams(identity, input)))
        return toHarnessDoctorType(result)
    }
}
