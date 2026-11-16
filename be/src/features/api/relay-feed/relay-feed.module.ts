import { Module } from "@nestjs/common"
import { GetRelayManifestHandler } from "./application/get-relay-manifest.handler"
import { GetLessonSourceArchiveHandler } from "./application/get-lesson-source-archive.handler"
import { GetLessonScenarioRunsHandler } from "./application/get-lesson-scenario-runs.handler"
import { UploadRelayEventHandler } from "./application/upload-relay-event.handler"
import { ConfigurableModuleClass } from "./relay-feed.module-definition"

@Module({
    providers: [
        GetRelayManifestHandler,
        UploadRelayEventHandler,
        GetLessonScenarioRunsHandler,
        GetLessonSourceArchiveHandler,
    ],
})
/** Application handlers of the relay feed: the signed manifest read, the device uploads and a lesson's scenario runs. */
export class RelayFeedApiModule extends ConfigurableModuleClass {}
