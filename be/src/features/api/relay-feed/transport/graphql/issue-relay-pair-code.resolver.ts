import { Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RateLimit, RateTier } from "@modules/platform/http-security"
import { IssueRelayPairCodeCommand } from "../../application/issue-relay-pair-code.command"
import { RelayPairCodeType } from "./dto/relay-pair-code.type"

@Resolver()
/** GraphQL door that issues the signed-in learner's six-digit pairing code. */
export class IssueRelayPairCodeResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Issues a six-digit code valid for ten minutes and one use; the CLI claims it with claimRelayPairCode. */
    @Mutation(() => RelayPairCodeType, { name: "issueRelayPairCode" })
    @RateLimit(RateTier.Strict)
    async issueRelayPairCode(@CurrentPrincipal() identity: IdentityPrincipal): Promise<RelayPairCodeType> {
        return this.commandBus.execute(
            new IssueRelayPairCodeCommand({ request: {}, principal: { id: identity.subject, role: "authenticated" } }),
        )
    }
}
