import { Injectable } from "@nestjs/common"
import { InjectHttpClient } from "@modules/platform/http"
import type { HttpClient } from "@modules/platform/http"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { ok, refused } from "@modules/platform/primitives"
import type { Outcome } from "@modules/platform/primitives"
import { PayosErrorCode } from "./errors/payos.error"
import { PayosLogEvent } from "./payos.log-events"
import { InjectPayosOptions } from "./payos.decorators"
import type { PayosModuleOptions } from "./payos.options"
import type { PayosCheckout, PayosCheckoutInput, PayosConfirmation, PayosConfirmationInput } from "./payos.contracts"
import {
    payosCheckoutPayable,
    payosPaymentAnswerOf,
    payosPaymentLinkOf,
    payosPaymentRequest,
} from "./policies/payos-checkout.policy"
import { payosSignatureValid, payosTransactionOf, payosWebhookOf } from "./policies/payos-confirmation.policy"

@Injectable()
/** The payOS rail's only protocol speaker: it verifies payOS's own confirmations and grants nothing itself. */
export class PayosClient {
    constructor(
        @InjectPayosOptions() private readonly options: PayosModuleOptions,
        @InjectLogger() private readonly logger: Logger,
        @InjectHttpClient() private readonly http: HttpClient,
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

    /**
     * Creates the hosted payment link of one order with `POST /v2/payment-requests`, signed under the channel checksum key,
     * and verifies the answer's code and signature before the link is trusted.
     *
     * @param input the persisted order, the buyer's return addresses and the correlation id of the calling request.
     * @returns the proved checkout `(rail, providerRef, orderCode, amount, redirect)`, or the refusal that stood in its place.
     */
    async createCheckout(input: PayosCheckoutInput): Promise<Outcome<PayosCheckout, PayosErrorCode>> {
        const channel = this.options.channel
        if (channel === null) return this.refuseCheckout(PayosErrorCode.RailNotConfigured)
        if (!payosCheckoutPayable(input)) return this.refuseCheckout(PayosErrorCode.CheckoutInvalid)
        const checksumKey = channel.checksumKey.reveal()
        const answered = await this.http
            .request({
                correlationId: input.correlationId,
                method: "POST",
                url: `${channel.apiBase}/v2/payment-requests`,
                headers: { "x-client-id": channel.clientId, "x-api-key": channel.apiKey.reveal() },
                body: payosPaymentRequest(input, checksumKey),
                timeoutMs: channel.timeoutMs,
            })
            .then(
                (response) => response.body,
                (cause: unknown) => {
                    this.logger.error(PayosLogEvent.CheckoutRefused, cause, { code: PayosErrorCode.Unavailable })
                    return null
                },
            )
        if (answered === null) return this.refuseCheckout(PayosErrorCode.Unavailable)
        const answer = payosPaymentAnswerOf(answered)
        if (answer === null) return this.refuseCheckout(PayosErrorCode.PayloadMalformed)
        if (answer.code !== "00") return this.refuseCheckout(PayosErrorCode.CheckoutRefused)
        if (answer.data === null || answer.signature === null) return this.refuseCheckout(PayosErrorCode.PayloadMalformed)
        if (!payosSignatureValid(answer.data, answer.signature, checksumKey))
            return this.refuseCheckout(PayosErrorCode.SignatureInvalid)
        const link = payosPaymentLinkOf(answer.data, input)
        if (link === null) return this.refuseCheckout(PayosErrorCode.PayloadMalformed)
        return ok({
            rail: "payos",
            providerRef: link.paymentLinkId,
            orderCode: input.orderCode,
            amount: input.amount,
            redirect: { method: "GET", url: link.checkoutUrl },
        })
    }

    /** Logs a refused checkout under its code, never the order or the answer, and answers it. */
    private refuseCheckout(code: PayosErrorCode): Outcome<PayosCheckout, PayosErrorCode> {
        this.logger.warn(PayosLogEvent.CheckoutRefused, { code })
        return refused(code)
    }

    /** Logs a refused confirmation under its code, never the delivery, and answers it. */
    private refuse(code: PayosErrorCode): Outcome<PayosConfirmation, PayosErrorCode> {
        this.logger.warn(PayosLogEvent.ConfirmationRefused, { code })
        return refused(code)
    }
}
