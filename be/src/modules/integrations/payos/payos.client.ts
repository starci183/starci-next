import { Injectable } from "@nestjs/common"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { ok, refused } from "@modules/platform/primitives"
import type { Outcome } from "@modules/platform/primitives"
import { PayosErrorCode } from "./errors/payos.error"
import { PayosLogEvent } from "./payos.log-events"
import { InjectPayosOptions } from "./payos.decorators"
import type { PayosModuleOptions } from "./payos.options"
import type { PayosConfirmation, PayosConfirmationInput } from "./payos.contracts"
import { payosSignatureValid, payosTransactionOf, payosWebhookOf } from "./policies/payos-confirmation.policy"

@Injectable()
/** The payOS rail's only protocol speaker: it verifies payOS's own confirmations and grants nothing itself. */
export class PayosClient {
    constructor(
        @InjectPayosOptions() private readonly options: PayosModuleOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Verifies one posted webhook against the channel checksum key before any field of it is trusted: the envelope shape,
     * the signature over the `data` object, and then the paid-transfer facts.
     *
     * @param input the webhook body payOS posted, parsed from JSON but not yet trusted.
     * @returns the proved confirmation `(rail, providerRef, orderCode, amount)`, or the refusal that stood in its place.
     */
    verifyConfirmation(input: PayosConfirmationInput): Outcome<PayosConfirmation, PayosErrorCode> {
        const channel = this.options.channel
        if (channel === null) return this.refuse(PayosErrorCode.RailNotConfigured)
        const webhook = payosWebhookOf(input.body)
        if (webhook === null) return this.refuse(PayosErrorCode.PayloadMalformed)
        if (!payosSignatureValid(webhook.data, webhook.signature, channel.checksumKey.reveal()))
            return this.refuse(PayosErrorCode.SignatureInvalid)
        if (webhook.code !== "00" || !webhook.success) return this.refuse(PayosErrorCode.PaymentNotConfirmed)
        const transaction = payosTransactionOf(webhook.data)
        if (transaction === null) return this.refuse(PayosErrorCode.PayloadMalformed)
        return ok({
            rail: "payos",
            providerRef: transaction.reference,
            orderCode: transaction.orderCode,
            amount: transaction.amount,
        })
    }

    /** Logs a refused confirmation under its code, never the delivery, and answers it. */
    private refuse(code: PayosErrorCode): Outcome<PayosConfirmation, PayosErrorCode> {
        this.logger.warn(PayosLogEvent.ConfirmationRefused, { code })
        return refused(code)
    }
}
