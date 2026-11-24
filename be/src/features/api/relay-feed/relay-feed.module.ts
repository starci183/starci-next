import { Module } from "@nestjs/common"
import { GetRelayManifestHandler } from "./application/get-relay-manifest.handler"
import { GetHarnessPackHandler } from "./application/get-harness-pack.handler"
import { GetLessonSourceArchiveHandler } from "./application/get-lesson-source-archive.handler"
import { GetLessonBugsArchiveHandler } from "./application/get-lesson-bugs-archive.handler"
import { GetLessonBugResultsHandler } from "./application/get-lesson-bug-results.handler"
import { OpenLessonBugHintHandler } from "./application/open-lesson-bug-hint.handler"
import { GetLessonChallengeScoresHandler } from "./application/get-lesson-challenge-scores.handler"
import { GetLessonPartsProgressHandler } from "./application/get-lesson-parts-progress.handler"
import { RequestLessonRunHandler } from "./application/request-lesson-run.handler"
import { GetLessonScenarioRunsHandler } from "./application/get-lesson-scenario-runs.handler"
import { UploadRelayEventHandler } from "./application/upload-relay-event.handler"
import { ClaimRelayPairCodeHandler } from "./application/claim-relay-pair-code.handler"
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
        GetLessonScenarioRunsHandler,
        GetLessonPartsProgressHandler,
        GetLessonChallengeScoresHandler,
        RequestLessonRunHandler,
        GetLessonSourceArchiveHandler,
        GetLessonBugsArchiveHandler,
        GetLessonBugResultsHandler,
        OpenLessonBugHintHandler,
        GetHarnessPackHandler,
        ClaimRelayPairCodeHandler,
        GetCourseLabHandler,
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
