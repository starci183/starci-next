import { CommandHandler } from "@nestjs/cqrs"
import { McpTutorService } from "@modules/domain/mcp"
import { RelayError, RelayErrorCode } from "@modules/domain/relay"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { LessonRunRequested } from "./request-lesson-run.contracts"
import { RequestLessonRunCommand } from "./request-lesson-run.command"

@CommandHandler(RequestLessonRunCommand)
/**
 * Sends one scenario run to the learner's online device through the same service the MCP `request_run` tool uses (the scenario
 * must be a public one, every guard must be one it names, Kịch bản must be readable). The device shows the command and asks the
 * learner before it runs anything; the result comes back through `lessonScenarioRuns`. With no device online nothing is sent
 * and the door answers RELAY_DEVICE_OFFLINE.
 */
export class RequestLessonRunHandler extends ICQRSHandler<RequestLessonRunCommand, LessonRunRequested> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly tutor: McpTutorService,
    ) {
        super(logger)
    }

    protected override async process(command: RequestLessonRunCommand): Promise<LessonRunRequested> {
        const { lessonId, scenarioId, guardsOff } = command.params.request
        const sent = await this.tutor.requestRun(command.params.principal.id, lessonId, scenarioId, guardsOff)
        if (!sent.delivered || sent.device === null || sent.manifestId === null)
            throw new RelayError({ code: RelayErrorCode.DeviceOffline })
        return { device: sent.device, command: sent.command, manifestId: sent.manifestId }
    }
}
