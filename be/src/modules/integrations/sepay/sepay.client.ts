import { Injectable } from "@nestjs/common"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ok, refused, type Outcome } from "@modules/platform/primitives"
import { SepayErrorCode } from "./errors/sepay.error"
import { SepayLogEvent } from "./sepay.log-events"
import { InjectSepayOptions } from "./sepay.decorators"
import type { SepayModuleOptions } from "./sepay.options"
import type { SepayCheckout, SepayCheckoutInput, SepayConfirmation, SepayConfirmationInput } from "./sepay.contracts"
import { sepayCheckoutFields, sepayCheckoutPayable, sepayCheckoutSignature } from "./policies/sepay-checkout.policy"
import {
    sepayDeliveryAuthorized,
    sepayIpnOf,
    sepayOrderOf,
    sepayPaymentStateOf,
} from "./policies/sepay-confirmation.policy"

@Injectable()
/** The SePay rail's only protocol speaker: it verifies SePay's own confirmations and grants nothing itself. */
export class SepayClient {
    constructor(
        @InjectSepayOptions() private readonly options: SepayModuleOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Verifies one posted IPN notification against the configured secret key before any field of it is trusted: the
     * `x-secret-key` header, the envelope shape, and then the order facts. A verified notification that reports no paid
     * order (a `TRANSACTION_VOID`, or an order not `CAPTURED` and `APPROVED`) is answered with its state, never as paid.
     *
     * @param input the IPN body SePay posted, parsed from JSON but not yet trusted, and the headers it arrived with.
     * @returns the proved confirmation `(rail, state, providerRef, orderCode, amount, currency)`, or the refusal that stood
     * in its place.
     */
    verifyConfirmation(input: SepayConfirmationInput): Outcome<SepayConfirmation, SepayErrorCode> {
        const channel = this.options.channel
        if (channel === null) return this.refuse(SepayErrorCode.RailNotConfigured)
        if (!sepayDeliveryAuthorized(input.headers, channel.secretKey.reveal()))
            return this.refuse(SepayErrorCode.SecretInvalid)
        const ipn = sepayIpnOf(input.body)
        if (ipn === null) return this.refuse(SepayErrorCode.PayloadMalformed)
        const order = sepayOrderOf(ipn)
        if (order === null) return this.refuse(SepayErrorCode.PayloadMalformed)
        return ok({
            rail: "sepay",
            state: sepayPaymentStateOf(ipn),
            providerRef: order.providerRef,
            orderCode: order.orderCode,
            amount: order.amount,
            currency: order.currency,
        })
    }

    /**
     * Builds the server-signed one-time-payment form the buyer's browser submits to SePay. No call is made: the form is
     * signed here with the signing secret, which never leaves the client.
     *
     * @param input the persisted order and the three addresses the buyer returns to.
     * @returns the signed form `(rail, orderCode, amount, redirect)`, or the refusal that stood in its place.
     */
    createCheckout(input: SepayCheckoutInput): Outcome<SepayCheckout, SepayErrorCode> {
        const channel = this.options.channel
        if (channel === null) return this.refuseCheckout(SepayErrorCode.RailNotConfigured)
        if (!sepayCheckoutPayable(input)) return this.refuseCheckout(SepayErrorCode.CheckoutInvalid)
        const fields = sepayCheckoutFields(input, channel.merchantId)
        const signature = sepayCheckoutSignature(fields, channel.signingKey.reveal())
        return ok({
            rail: "sepay",
            orderCode: input.orderCode,
            amount: input.amount,
            redirect: { method: "POST", url: channel.checkoutUrl, fields: { ...fields, signature } },
        })
    }

    /** Logs a refused confirmation under its code, never the delivery, and answers it. */
    private refuse(code: SepayErrorCode): Outcome<SepayConfirmation, SepayErrorCode> {
        this.logger.warn(SepayLogEvent.ConfirmationRefused, { code })
        return refused(code)
    }

    /** Logs a refused checkout under its code, never the order, and answers it. */
    private refuseCheckout(code: SepayErrorCode): Outcome<SepayCheckout, SepayErrorCode> {
        this.logger.warn(SepayLogEvent.CheckoutRefused, { code })
        return refused(code)
    }
}
