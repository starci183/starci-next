import { Module } from "@nestjs/common"
import { PathApiModule } from "../../path.module"
import { ChooseOutcomePathResolver } from "./choose-outcome-path.resolver"
import { OutcomePathsResolver } from "./outcome-paths.resolver"
import { ConfigurableModuleClass } from "./path-graphql.module-definition"

@Module({
    imports: [PathApiModule.register({})],
    providers: [OutcomePathsResolver, ChooseOutcomePathResolver],
})
/** The GraphQL transport of the path feature: the outcome paths and choosing one. */
export class PathGraphqlModule extends ConfigurableModuleClass {}
