import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./review.module-definition"
import { ReviewCli } from "./review.cli"
import { ImportReviewDecksCli } from "./subs/import.cli"

@Module({ providers: [ReviewCli, ImportReviewDecksCli] })
/** The review group: its command and its sub-commands; the import itself is the review capability's service. */
export class ReviewCliModule extends ConfigurableModuleClass {}
