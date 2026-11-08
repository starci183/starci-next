import { Injectable } from "@nestjs/common"
import { InjectMailer, type Mailer } from "@modules/integrations/mail"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectMessageCatalog, type MessageCatalog } from "@modules/platform/i18n"
import type { CodeMailParams } from "./challenge.contracts"
import { toCodeMail } from "./challenge.mapper"
import { minutesLeft } from "./challenge.policy"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"

@Injectable()
/** Sends the emailed code in the receiver's language; the code appears nowhere else and is never logged. */
export class CodeMailService {
    constructor(
        @InjectMailer() private readonly mailer: Mailer,
        @InjectMessageCatalog() private readonly messages: MessageCatalog,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** Mails one code; a mail the server did not accept is `ProviderUnavailable`. */
    async send(params: CodeMailParams): Promise<void> {
        const minutes = minutesLeft(params.expiresAt, this.clock.now())
        const message = toCodeMail(this.messages, params.purpose, params.locale, params.code, minutes)
        await this.mailer.send({ to: params.email, message }).catch((cause: unknown) => {
            throw new IdentityError({ code: IdentityErrorCode.ProviderUnavailable, cause })
        })
    }
}
