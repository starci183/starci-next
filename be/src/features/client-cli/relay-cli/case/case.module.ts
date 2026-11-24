import { Module } from "@nestjs/common"
import { CaseCli } from "./case.cli"
import { ConfigurableModuleClass } from "./case.module-definition"
import { CaseDiffCli } from "./subs/diff.cli"
import { CaseListCli } from "./subs/list.cli"
import { CaseResetToCli } from "./subs/reset-to.cli"
import { CaseRunCli } from "./subs/run.cli"

@Module({ providers: [CaseCli, CaseListCli, CaseRunCli, CaseDiffCli, CaseResetToCli] })
/** The case group of the learner CLI: the ladder case commands of a lab@2 lab; the relay client comes from the learner root. */
export class CaseCliModule extends ConfigurableModuleClass {}
