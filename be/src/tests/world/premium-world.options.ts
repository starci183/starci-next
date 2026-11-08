import type { DynamicModule } from "@nestjs/common"
import { builder, mock } from "@starci/jest-preset"
import { EntitlementModule } from "@modules/domain/entitlement"
import { NotificationModule } from "@modules/domain/notification"
import { PurchaseModule } from "@modules/domain/purchase"
import { PayosModule, type PayosOptions } from "@modules/integrations/payos"
import { SepayModule, type SepayOptions } from "@modules/integrations/sepay"
import { Secret } from "@modules/platform/config"
import { HTTP_CLIENT, type HttpClient } from "@modules/platform/http"

/** The SePay IPN secret key the deployment of the world holds. */
export const SEPAY_SECRET = "fake-sepay-ipn-secret"

/** The learner web origin the provider return addresses are built from. */
export const RETURN_BASE = "https://app.starci.test"

const sepayChannelOf = builder<SepayOptions>({
    secretKey: new Secret(SEPAY_SECRET),
    merchantId: "SP-TEST-MERCHANT",
    signingKey: new Secret("fake-sepay-signing-key"),
    checkoutUrl: "https://sandbox.pay.sepay.test/v1/checkout/init",
})

const payosChannelOf = builder<PayosOptions>({
    checksumKey: new Secret("fake-payos-checksum-key"),
    clientId: "payos-client-id",
    apiKey: new Secret("fake-payos-api-key"),
    apiBase: "https://api-merchant.payos.test",
    timeoutMs: 2000,
})

/** The network edge of the payOS merchant API: the premium worlds start no payOS checkout, so its double answers nothing. */
class HttpEdgeModule {}
const edge = mock<HttpClient>()
const edgeModule = (): DynamicModule => ({
    module: HttpEdgeModule,
    providers: [{ provide: HTTP_CLIENT, useFactory: (): HttpClient => edge }],
    exports: [HTTP_CLIENT],
})

/** The purchase capability over both rails and the entitlement capability, as the premium worlds compose them. */
export const premiumWorldModule = (): DynamicModule => ({
    ...PurchaseModule.register({ returnBaseUrl: RETURN_BASE }),
    imports: [
        EntitlementModule.register({}),
        NotificationModule.register({}),
        SepayModule.register({ channel: sepayChannelOf() }),
        { ...PayosModule.register({ channel: payosChannelOf() }), imports: [edgeModule()] },
    ],
})
