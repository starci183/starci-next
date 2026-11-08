/** The server-owned monthly price in whole VND. */
export const MONTHLY = 229_000

/** The server-owned yearly price in whole VND. */
export const YEARLY = 2_290_000

/** A key the deployment never held: a delivery proved with it proves nothing. */
export const FORGED_KEY = "a-key-the-deployment-never-held"

/**
 * The bytes of a SePay IPN that reports one order paid by one transaction, as SePay's IPN specification shapes it: an
 * `ORDER_PAID` whose order is `CAPTURED` in VND and whose transaction is `APPROVED`.
 */
export const sepayBody = (orderCode: string, amount: number, transactionId: string): Buffer =>
    Buffer.from(
        JSON.stringify({
            timestamp: 1_790_000_000,
            notification_type: "ORDER_PAID",
            order: {
                order_invoice_number: orderCode,
                order_amount: `${amount}.00`,
                order_currency: "VND",
                order_status: "CAPTURED",
            },
            transaction: { transaction_id: transactionId, transaction_status: "APPROVED" },
            customer: {},
        }),
    )
