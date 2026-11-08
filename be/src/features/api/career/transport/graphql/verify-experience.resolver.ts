import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { VerifyExperienceQuery } from "../../application/verify-experience.query"
import { VerifyExperienceInput } from "./dto/verify-experience.input"
import { VerificationType } from "./dto/verification.type"
import { toVerifyExperienceParams, toVerifyExperienceType } from "./verify-experience.mapper"

@Resolver()
/** GraphQL door of the public verification page /verify/{code}; it needs no session and shows no score, code or name. */
export class VerifyExperienceResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the signed line, the signer role and date, or the revoked state. */
    @Query(() => VerificationType, { name: "verifyExperience" })
    @Public({ reason: PublicReason.CatalogRead })
    async verifyExperience(@Args("input") input: VerifyExperienceInput): Promise<VerificationType> {
        const result = await this.queryBus.execute(new VerifyExperienceQuery(toVerifyExperienceParams(input)))
        return toVerifyExperienceType(result)
    }
}
