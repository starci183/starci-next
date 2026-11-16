import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessDocQuery } from "../../application/get-harness-doc.query"
import { HarnessDocInput } from "./dto/harness-doc.input"
import { HarnessDocType } from "./dto/harness-doc.type"
import { toHarnessDocType, toHarnessDocParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: one doc with its sections; it needs a session and no Premium. */
export class GetHarnessDocResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one doc with its sections. */
    @Query(() => HarnessDocType, { name: "harnessDoc" })
    async harnessDoc(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: HarnessDocInput,
    ): Promise<HarnessDocType> {
        const result = await this.queryBus.execute(new GetHarnessDocQuery(toHarnessDocParams(identity, input)))
        return toHarnessDocType(result)
    }
}
