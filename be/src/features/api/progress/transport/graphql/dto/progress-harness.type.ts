import { Field, Int, ObjectType } from "@nestjs/graphql"
import { ProgressBuildType } from "./progress-build.type"
import { ProgressDoctorType } from "./progress-doctor.type"
import { ProgressTrialType } from "./progress-trial.type"

@ObjectType()
/** The Harness section of the progress page; free for everyone. */
export class ProgressHarnessType {
    /** Builds with every stage proved. */
    @Field(() => Int)
    buildsDone!: number

    /** Builds. */
    @Field(() => Int)
    buildsTotal!: number

    /** The builds. */
    @Field(() => [ProgressBuildType])
    builds!: Array<ProgressBuildType>

    /** The doctor verdict of each tool. */
    @Field(() => [ProgressDoctorType])
    doctor!: Array<ProgressDoctorType>

    /** The newest trial of each trap. */
    @Field(() => [ProgressTrialType])
    trials!: Array<ProgressTrialType>
}
