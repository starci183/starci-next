"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useSession } from "@/hooks/auth"
import { isOrderNotFound } from "@/hooks/checkout"
import { loadingSlot, mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryMyPremiumSwr, useQueryPremiumOrderSwr } from "@/hooks/swr"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot } from "@/modules/types"
import {
    CheckoutResultBase,
    type CheckoutResultShape,
    type ResultAction,
    type ResultFact,
    type ResultView,
} from "./component"

/** Input of the result: the order the return address names. The address carries no verdict, so only the order id is read from it. */
type CheckoutResultProps = {
    readonly orderId: string | undefined
}

/** The drawing the server's order status selects; an unknown status keeps the verifying drawing and never claims success. */
const SHAPE_OF_STATUS = new Map<string, CheckoutResultShape>([
    ["active", "active"],
    ["failed", "failed"],
    ["expired", "expired"],
])

/** The translator of this block's catalog namespace. */
type ResultTranslator = ReturnType<typeof useTranslations<"app.checkoutResult">>

/** The words of each drawing: heading, status (the state in the band) and body. */
const copiesOf = (t: ResultTranslator) => ({
    verifying: { title: t("verifyingTitle"), status: t("verifyingStatus"), body: t("verifyingBody") },
    active: { title: t("activeTitle"), status: t("activeStatus"), body: t("activeBody") },
    failed: { title: t("failedTitle"), status: t("failedStatus"), body: t("failedBody") },
    expired: { title: t("expiredTitle"), status: t("expiredStatus"), body: t("expiredBody") },
    notFound: { title: t("notFoundTitle"), status: t("notFoundStatus"), body: t("notFoundBody") },
    signedOut: { title: t("signedOutTitle"), status: t("signedOutStatus"), body: t("signedOutBody") },
})

/** The onward destinations of each drawing, one per state: a pending order only leads back to Học, a paid one on to Projects, the rest to the plans. */
const actionsOf = (t: ResultTranslator) => {
    const plans: ResultAction = { label: t("plansLabel"), href: APP_ROUTES.premium }
    return {
        verifying: { commit: undefined, neutral: { label: t("homeLabel"), href: APP_ROUTES.home } },
        active: { commit: { label: t("projectsLabel"), href: APP_ROUTES.projects }, neutral: undefined },
        failed: { commit: { label: t("retryLabel"), href: APP_ROUTES.premium }, neutral: undefined },
        expired: { commit: { label: t("newOrderLabel"), href: APP_ROUTES.premium }, neutral: undefined },
        notFound: { commit: plans, neutral: undefined },
        signedOut: { commit: { label: t("signInLabel"), href: APP_ROUTES.signIn }, neutral: undefined },
    }
}

/**
 * The checkout result. It shows the state the server reports for the order, polling while the server says `verifying`; an address
 * with no order shows the reader's Premium term when one is active (the entitlement read), else that no order was found; a
 * `result` hint in the address is never read, so a cancelled order simply stays verifying until the server expires it.
 */
export const CheckoutResult = (props: CheckoutResultProps) => {
    const t = useTranslations("app.checkoutResult")
    const format = useFormatter()
    const slotLabels = useSlotLabels()
    const session = useSession()
    const read = useQueryPremiumOrderSwr(props.orderId, session.status === "signed-in")
    const mine = useQueryMyPremiumSwr(session.status === "signed-in" && props.orderId === undefined)
    const copies = copiesOf(t)
    const actions = actionsOf(t)
    const planNames = new Map([
        ["monthly", t("planMonthly")],
        ["yearly", t("planYearly")],
    ])
    const railNames = new Map([
        ["sepay", t("railSepay")],
        ["payos", t("railPayos")],
    ])
    const dateOf = (iso: string): string => format.dateTime(new Date(iso), { dateStyle: "medium" })
    const viewOf = (
        shape: CheckoutResultShape,
        facts: ReadonlyArray<ResultFact>,
        order?: { readonly code: string; readonly plan: string },
    ): ResultView => ({
        title: copies[shape].title,
        body: copies[shape].body,
        meta: order === undefined ? copies[shape].status : `${order.plan} · ${copies[shape].status}`,
        orderCrumb: order === undefined ? undefined : t("orderCrumb", { code: order.code }),
        facts,
        ...actions[shape],
    })
    const order = slotOfSwr(read)
    const orderShape = (status: string): CheckoutResultShape => SHAPE_OF_STATUS.get(status) ?? "verifying"
    const settled: DataSlot<{ readonly shape: CheckoutResultShape; readonly view: ResultView }> = mapSlot(
        order,
        (found) => {
            const shape = orderShape(found.status)
            const plan = planNames.get(found.plan) ?? t("planOther")
            const until = found.premiumUntil
            const facts: ReadonlyArray<ResultFact> = [
                { id: "code", term: t("factCode"), description: found.orderCode },
                { id: "plan", term: t("factPlan"), description: plan },
                {
                    id: "amount",
                    term: t("factAmount"),
                    description: format.number(found.amountVnd, { style: "currency", currency: "VND" }),
                },
                { id: "rail", term: t("factRail"), description: railNames.get(found.rail) ?? found.rail },
                ...(shape === "active" && until
                    ? [{ id: "until", term: t("factUntil"), description: dateOf(until) }]
                    : []),
            ]
            return { shape, view: viewOf(shape, facts, { code: found.orderCode, plan }) }
        },
    )
    const fixed = (shape: CheckoutResultShape) => ({ items: { shape, view: viewOf(shape, []) } })
    const premiumUntil = mine.data?.isPremium === true ? mine.data.premiumUntil : undefined
    const withoutOrder = (): DataSlot<{ readonly shape: CheckoutResultShape; readonly view: ResultView }> => {
        if (mine.data === undefined && mine.error === undefined) return loadingSlot()
        if (premiumUntil === undefined || premiumUntil === null) return fixed("notFound")
        const facts = [{ id: "until", term: t("factUntil"), description: dateOf(premiumUntil) }]
        return { items: { shape: "active", view: viewOf("active", facts) } }
    }
    const picked = (): DataSlot<{ readonly shape: CheckoutResultShape; readonly view: ResultView }> => {
        if (session.status === "signed-out") return fixed("signedOut")
        if (session.status === "unknown") return loadingSlot()
        if (props.orderId === undefined) return withoutOrder()
        if (isOrderNotFound(read.error)) return fixed("notFound")
        return settled
    }
    const slot = picked()
    return (
        <CheckoutResultBase
            shape={"items" in slot ? slot.items.shape : "verifying"}
            props={{
                pageTitle: t("title"),
                trailLabel: t("trailLabel"),
                plansLabel: t("premiumCrumb"),
                plansHref: APP_ROUTES.premium,
                view: mapSlot(slot, (item) => item.view),
                slotLabels: slotLabels(t("unavailableBody")),
            }}
            on={{ retry: () => void read.mutate() }}
        />
    )
}
