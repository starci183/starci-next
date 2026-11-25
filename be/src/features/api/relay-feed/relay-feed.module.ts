import { Module } from "@nestjs/common"
import { GetRelayManifestHandler } from "./application/get-relay-manifest.handler"
import { GetHarnessPackHandler } from "./application/get-harness-pack.handler"
import { GetLessonSourceArchiveHandler } from "./application/get-lesson-source-archive.handler"
import { GetLessonBugsArchiveHandler } from "./application/get-lesson-bugs-archive.handler"
import { UploadRelayEventHandler } from "./application/upload-relay-event.handler"
import { ClaimRelayPairCodeHandler } from "./application/claim-relay-pair-code.handler"
import { GetCourseLabArchiveHandler } from "./application/get-course-lab-archive.handler"
import { GetCourseLabHandler } from "./application/get-course-lab.handler"
import { IssueRelayPairCodeHandler } from "./application/issue-relay-pair-code.handler"
import { RegisterRelayDeviceKeyHandler } from "./application/register-relay-device-key.handler"
import { RunCourseLabTestsHandler } from "./application/run-course-lab-tests.handler"
import { SetCourseLabChaosHandler } from "./application/set-course-lab-chaos.handler"
import { StartCourseLabHandler } from "./application/start-course-lab.handler"
import { SubmitCourseLabHandler } from "./application/submit-course-lab.handler"
import { ConfigurableModuleClass } from "./relay-feed.module-definition"

@Module({
    providers: [
        GetRelayManifestHandler,
        UploadRelayEventHandler,
        GetLessonSourceArchiveHandler,
        GetLessonBugsArchiveHandler,
        GetHarnessPackHandler,
        ClaimRelayPairCodeHandler,
        GetCourseLabHandler,
        GetCourseLabArchiveHandler,
        IssueRelayPairCodeHandler,
        RegisterRelayDeviceKeyHandler,
        RunCourseLabTestsHandler,
        SetCourseLabChaosHandler,
        StartCourseLabHandler,
        SubmitCourseLabHandler,
    ],
})
/** Application handlers of the relay feed: the signed manifest read, the device uploads and a lesson's scenario runs, the lab of a lesson and the six-digit pairing. */
export class RelayFeedApiModule extends ConfigurableModuleClass {}
