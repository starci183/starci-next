import { Module } from "@nestjs/common"
import { ConfigurableModuleClass } from "./probe-sink-http.module-definition"
import { ProbeSinkWebhook } from "./probe-sink.webhook"

@Module({ controllers: [ProbeSinkWebhook] })
/** The HTTP transport of the server probes' sink: the door a learner's app delivers its events to; the sink comes from the project capability. */
export class ProbeSinkHttpModule extends ConfigurableModuleClass {}
