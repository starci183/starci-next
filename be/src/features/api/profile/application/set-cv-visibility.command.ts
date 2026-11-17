import { Command } from "@nestjs/cqrs"
import type { CvLinkView } from "@modules/domain/profile"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetCvVisibilityRequest } from "./set-cv-visibility.contracts"

/** Makes the CV of the learner public or private and answers the link. */
export class SetCvVisibilityCommand extends Command<CvLinkView> {
    constructor(readonly params: ExecuteParams<SetCvVisibilityRequest>) {
        super()
    }
}
