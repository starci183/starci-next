import { Module } from "@nestjs/common"
import { RelayFeedApiModule } from "../../relay-feed.module"
import { GetRelayManifestResolver } from "./get-relay-manifest.resolver"
import { LessonChallengeScoresResolver } from "./lesson-challenge-scores.resolver"
import { LessonPartsProgressResolver } from "./lesson-parts-progress.resolver"
import { RequestLessonRunResolver } from "./request-lesson-run.resolver"
import { LessonScenarioRunsResolver } from "./lesson-scenario-runs.resolver"
import { LessonBugResultsResolver } from "./lesson-bug-results.resolver"
import { RelayCheckStartedResolver } from "./relay-check-started.resolver"
import { RelayCheckResultResolver } from "./relay-check-result.resolver"
import { RelayHarnessResultResolver } from "./relay-harness-result.resolver"
import { RelayLogResolver } from "./relay-log.resolver"
import { RelayManifestAckResolver } from "./relay-manifest-ack.resolver"
import { ClaimRelayPairCodeResolver } from "./claim-relay-pair-code.resolver"
import { GetCourseLabResolver } from "./get-course-lab.resolver"
import { IssueRelayPairCodeResolver } from "./issue-relay-pair-code.resolver"
import { RegisterRelayDeviceKeyResolver } from "./register-relay-device-key.resolver"
import { RelayLabBootResolver } from "./relay-lab-boot.resolver"
import { RelayLabFilesResolver } from "./relay-lab-files.resolver"
import { RelayLabGradeResolver } from "./relay-lab-grade.resolver"
import { RelayLabTestsResolver } from "./relay-lab-tests.resolver"
import { RunCourseLabTestsResolver } from "./run-course-lab-tests.resolver"
import { SetCourseLabChaosResolver } from "./set-course-lab-chaos.resolver"
import { StartCourseLabResolver } from "./start-course-lab.resolver"
import { SubmitCourseLabResolver } from "./submit-course-lab.resolver"
import { ConfigurableModuleClass } from "./relay-feed-graphql.module-definition"

@Module({
    imports: [RelayFeedApiModule.register({})],
    providers: [
        GetRelayManifestResolver,
        RelayCheckStartedResolver,
        RelayCheckResultResolver,
        RelayHarnessResultResolver,
        RelayLogResolver,
        RelayManifestAckResolver,
        LessonScenarioRunsResolver,
        LessonBugResultsResolver,
        LessonPartsProgressResolver,
        LessonChallengeScoresResolver,
        RequestLessonRunResolver,
        ClaimRelayPairCodeResolver,
        GetCourseLabResolver,
        IssueRelayPairCodeResolver,
        RegisterRelayDeviceKeyResolver,
        RelayLabBootResolver,
        RelayLabFilesResolver,
        RelayLabGradeResolver,
        RelayLabTestsResolver,
        RunCourseLabTestsResolver,
        SetCourseLabChaosResolver,
        StartCourseLabResolver,
        SubmitCourseLabResolver,
    ],
})
/** The GraphQL transport of the relay feed, served by the core app: the signed manifest read, the upload mutations, the lab doors and the six-digit pairing. */
export class RelayFeedGraphqlModule extends ConfigurableModuleClass {}
