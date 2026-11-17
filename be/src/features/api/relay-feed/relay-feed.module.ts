import { Module } from "@nestjs/common"
import { GetRelayManifestHandler } from "./application/get-relay-manifest.handler"
import { GetHarnessPackHandler } from "./application/get-harness-pack.handler"
import { GetLessonSourceArchiveHandler } from "./application/get-lesson-source-archive.handler"
import { GetLessonChallengeScoresHandler } from "./application/get-lesson-challenge-scores.handler"
import { GetLessonPartsProgressHandler } from "./application/get-lesson-parts-progress.handler"
import { RequestLessonRunHandler } from "./application/request-lesson-run.handler"
import { GetLessonScenarioRunsHandler } from "./application/get-lesson-scenario-runs.handler"
import { UploadRelayEventHandler } from "./application/upload-relay-event.handler"
import { ConfigurableModuleClass } from "./relay-feed.module-definition"

@Module({
    providers: [
        GetRelayManifestHandler,
        UploadRelayEventHandler,
        GetLessonScenarioRunsHandler,
        GetLessonPartsProgressHandler,
        GetLessonChallengeScoresHandler,
        RequestLessonRunHandler,
        GetLessonSourceArchiveHandler,
        GetHarnessPackHandler,
    ],
})
/** Application handlers of the relay feed: the signed manifest read, the device uploads and a lesson's scenario runs. */
export class RelayFeedApiModule extends ConfigurableModuleClass {}
