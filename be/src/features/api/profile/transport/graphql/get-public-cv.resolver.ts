import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { Public, PublicReason } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetPublicCvQuery } from "../../application/get-public-cv.query"
import { PublicCvInput } from "./dto/public-cv.input"
import { PublicCvType } from "./dto/public-cv.type"
import { toGetPublicCvParams } from "./get-public-cv.mapper"

@Resolver()
/** GraphQL door of the public CV /cv/{slug}; it needs no session and shows no score, reviewer or e-mail. */
export class GetPublicCvResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the verified lines a learner shows on a public CV. */
    @Query(() => PublicCvType, { name: "publicCv" })
    @Public({ reason: PublicReason.CatalogRead })
    publicCv(@Args("input") input: PublicCvInput): Promise<PublicCvType> {
        return this.queryBus.execute(new GetPublicCvQuery(toGetPublicCvParams(input)))
    }
}
