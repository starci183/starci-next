import { Command } from "@nestjs/cqrs"
import type { PublicExecuteParams } from "@modules/platform/cqrs"
import type { CourseCaseUpload, UploadCourseCaseRequest } from "./upload-course-case.contracts"

/** Stores one case event (`case.result`, `case.hint` or `case.reset`) a paired device uploaded. */
export class UploadCourseCaseCommand extends Command<CourseCaseUpload> {
    constructor(readonly params: PublicExecuteParams<UploadCourseCaseRequest>) {
        super()
    }
}
