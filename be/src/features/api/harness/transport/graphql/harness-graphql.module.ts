import { Module } from "@nestjs/common"
import { HarnessApiModule } from "../../harness.module"
import { BindHarnessBuildResolver } from "./bind-harness-build.resolver"
import { GetHarnessBuildResolver } from "./get-harness-build.resolver"
import { GetHarnessBuildsResolver } from "./get-harness-builds.resolver"
import { GetHarnessDocResolver } from "./get-harness-doc.resolver"
import { GetHarnessDocsResolver } from "./get-harness-docs.resolver"
import { GetHarnessDoctorResolver } from "./get-harness-doctor.resolver"
import { GetHarnessGuideResolver } from "./get-harness-guide.resolver"
import { GetHarnessGuidesResolver } from "./get-harness-guides.resolver"
import { GetHarnessHubResolver } from "./get-harness-hub.resolver"
import { GetHarnessTrialsResolver } from "./get-harness-trials.resolver"
import { ConfigurableModuleClass } from "./harness-graphql.module-definition"

@Module({
    imports: [HarnessApiModule.register({})],
    providers: [
        GetHarnessHubResolver,
        GetHarnessBuildsResolver,
        GetHarnessBuildResolver,
        GetHarnessGuidesResolver,
        GetHarnessGuideResolver,
        GetHarnessDocsResolver,
        GetHarnessDocResolver,
        GetHarnessDoctorResolver,
        GetHarnessTrialsResolver,
        BindHarnessBuildResolver,
    ],
})
/** The GraphQL transport of the harness feature: the reads of the three parts and the build binding; free for everyone. */
export class HarnessGraphqlModule extends ConfigurableModuleClass {}
