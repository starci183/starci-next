import type { ModuleFactory } from "@starci/test-world"
import { SepayModule } from "@modules/integrations/sepay"
import { Secret } from "@modules/platform/config"

/** The header value the sepay world's channel accepts as its IPN credential. */
export const SEPAY_WORLD_IPN_HEADER = "world-sepay-ipn-header"

/** The modules of the sepay world: the rail over a sandbox channel; SePay is verified offline, so it needs no network double. */
export const sepayModules: ReadonlyArray<ModuleFactory> = [
    () =>
        SepayModule.register({
            isGlobal: true,
            channel: {
                secretKey: new Secret(SEPAY_WORLD_IPN_HEADER),
                merchantId: "SP-WORLD-MERCHANT",
                signingKey: new Secret("world-sepay-signing-secret-key"),
                checkoutUrl: "https://sandbox.pay.sepay.test/v1/checkout/init",
            },
        }),
]
