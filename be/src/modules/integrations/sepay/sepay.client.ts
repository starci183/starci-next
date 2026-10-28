import { Injectable } from "@nestjs/common"
import { InjectLogger } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { ok, refused } from "@modules/platform/primitives"
import type { Outcome } from "@modules/platform/primitives"
import { SepayErrorCode } from "./errors/sepay.error"
import { SepayLogEvent } from "./sepay.log-events"
import { InjectSepayOptions } from "./sepay.decorators"
import type { SepayModuleOptions } from "./sepay.options"
import type { SepayConfirmation, SepayConfirmationInput } from "./sepay.contracts"
import { sepayDeliveryAuthorized, sepayIpnOf, sepayOrderOf } from "./policies/sepay-confirmation.policy"

@Injectable()
/** The SePay rail's only protocol speaker: it verifies SePay's own confirmations and grants nothing itself. */
export class SepayClient {
    constructor(
        @InjectSepayOptions() private readonly options: SepayModuleOptions,
        @InjectLogger() private readonly logger: Logger,
    ) {}

    /**
     * Verifies one posted IPN notification against the configured secret key before any field of it is trusted: the
     * `x-secret-key` header, the envelope shape, and then the paid-order facts.
     *
     * @param input the IPN body SePay posted, parsed from JSON but not yet trusted, and the headers it arrived with.
     * @returns the proved confirmation `(rail, providerRef, orderCode, amount)`, or the refusal that stood in its place.
     */
    verifyConfirmation(input: SepayConfirmationInput): Outcome<SepayConfirmation, SepayErrorCode> {
        const channel = this.options.channel
        if (channel === null) return this.refuse(SepayErrorCode.RailNotConfigured)
        if (!sepayDeliveryAuthorized(input.headers, channel.secretKey.reveal()))
            return this.refuse(SepayErrorCode.SecretInvalid)
        const ipn = sepayIpnOf(input.body)
        if (ipn === null) return this.refuse(SepayErrorCode.PayloadMalformed)
        if (ipn.notificationType !== "ORDER_PAID") return this.refuse(SepayErrorCode.PaymentNotConfirmed)
        const order = sepayOrderOf(ipn)
        if (order === null) return this.refuse(SepayErrorCode.PayloadMalformed)
        return ok({
            rail: "sepay",
            providerRef: order.providerRef,
            orderCode: order.orderCode,
            amount: order.amount,
        })
    }

    /** Logs a refused confirmation under its code, never the delivery, and answers it. */
    private refuse(code: SepayErrorCode): Outcome<SepayConfirmation, SepayErrorCode> {
        this.logger.warn(SepayLogEvent.ConfirmationRefused, { code })
        return refused(code)
    }
}
