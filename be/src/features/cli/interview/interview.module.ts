import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./interview.module-definition"
import { InterviewCli } from "./interview.cli"
import { ImportInterviewCli } from "./subs/import.cli"
import { PublishInterviewCli } from "./subs/publish.cli"

@Module({ providers: [InterviewCli, ImportInterviewCli, PublishInterviewCli] })
/** The interview group: its command and its sub-commands; the import and the publish are the interview capability's services. */
export class InterviewCliModule extends ConfigurableModuleClass {}
