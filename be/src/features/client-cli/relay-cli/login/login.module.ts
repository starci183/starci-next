import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./login.module-definition"
import { LoginCli } from "./login.cli"

@Module({ providers: [LoginCli] })
/** The login command of the learner CLI; the relay client comes from the learner root. */
export class LoginCliModule extends ConfigurableModuleClass {}
