import { Module } from "@nestjs/common"
import { BindHarnessBuildHandler } from "./application/bind-harness-build.handler"
import { GetHarnessBuildHandler } from "./application/get-harness-build.handler"
import { GetHarnessBuildsHandler } from "./application/get-harness-builds.handler"
import { GetHarnessDocHandler } from "./application/get-harness-doc.handler"
import { GetHarnessDocsHandler } from "./application/get-harness-docs.handler"
import { GetHarnessDoctorHandler } from "./application/get-harness-doctor.handler"
import { GetHarnessGuideHandler } from "./application/get-harness-guide.handler"
import { GetHarnessGuidesHandler } from "./application/get-harness-guides.handler"
import { GetHarnessHubHandler } from "./application/get-harness-hub.handler"
import { GetHarnessTrialsHandler } from "./application/get-harness-trials.handler"
import { ConfigurableModuleClass } from "./harness.module-definition"

@Module({
    providers: [
        GetHarnessHubHandler,
        GetHarnessBuildsHandler,
        GetHarnessBuildHandler,
        GetHarnessGuidesHandler,
        GetHarnessGuideHandler,
        GetHarnessDocsHandler,
        GetHarnessDocHandler,
        GetHarnessDoctorHandler,
        GetHarnessTrialsHandler,
        BindHarnessBuildHandler,
    ],
})
/** Application handlers of the harness feature: the hub, builds, guides, docs, doctor and trial reads and the build binding. */
export class HarnessApiModule extends ConfigurableModuleClass {}
