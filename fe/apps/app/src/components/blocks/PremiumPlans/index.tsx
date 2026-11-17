"use client"

import { useFormatter, useTranslations } from "next-intl"
import { useState } from "react"
import { useSession } from "@/hooks/auth"
import { useCheckoutCommands } from "@/hooks/checkout"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryMyPremiumSwr, useQueryPremiumPlansSwr } from "@/hooks/swr"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"
import {
    PremiumPlansBase,
    type PlanOption,
    type PremiumPlansLabels,
    type PremiumPlansShape,
    type RailOption,
} from "./component"

/** The translator of this block's catalog namespace. */
type PlansTranslator = ReturnType<typeof useTranslations<"app.plans">>

/** The rail proposed to a reader with no last-used rail (Q-W2-6); the server's rail names are `sepay` and `payos`. */
const DEFAULT_RAIL = "sepay"

/** The plan proposed first: the yearly offer when the server lists it, otherwise the first listed. */
const preferredPlan = (plans: ReadonlyArray<PlanOption>): string =>
    plans.find((plan) => plan.id === "yearly")?.id ?? plans[0]?.id ?? ""

/** The hint under a rail: "last used" on the rail the reader paid with, "default" on SePay when there is no history. */
const railHint = (id: string, lastRail: string | undefined, t: PlansTranslator): string | undefined => {
    if (lastRail !== undefined) return id === lastRail ? t("railLast") : undefined
    return id === DEFAULT_RAIL ? t("railDefault") : undefined
}

/** The drawing the reader's session and entitlement select. */
const shapeOf = (isSignedOut: boolean, hasTerm: boolean): PremiumPlansShape => {
    if (isSignedOut) return "signedOut"
    return hasTerm ? "premium" : "ready"
}

/** The words of the screen; `until` is the formatted end of an active term, when the reader has one. */
const labelsOf = (t: PlansTranslator, until: string | undefined): PremiumPlansLabels => ({
    includesTitle: t("includesTitle"),
    benefits: [t("benefitContent")],
    expiryNote: t("expiryNote"),
    planLegend: t("planLegend"),
    railLegend: t("railLegend"),
    summaryLabel: t("summaryLabel"),
    failureTitle: t("failureTitle"),
    payNote: until === undefined ? t("payNote") : t("payNoteExtend", { date: until }),
    startLabel: until === undefined ? t("startLabel") : t("extendLabel"),
    startingLabel: t("startingLabel"),
    startUnavailable: t("startUnavailable"),
    signInLabel: t("signInLabel"),
})

/** The Premium plans screen: reads the offers and the reader's entitlement, holds the plan and rail choice, starts a checkout. */
export const PremiumPlans = () => {
    const t = useTranslations("app.plans")
    const format = useFormatter()
    const slotLabels = useSlotLabels()
    const session = useSession()
    const isSignedIn = session.status === "signed-in"
    const read = useQueryPremiumPlansSwr()
    const mine = useQueryMyPremiumSwr(isSignedIn)
    const checkout = useCheckoutCommands()
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    const [chosenPlan, setChosenPlan] = useState<string>()
    const [chosenRail, setChosenRail] = useState<string>()
    const entitlement = mine.data
    const premiumUntil = entitlement?.isPremium === true ? entitlement.premiumUntil : undefined
    const until = premiumUntil ? format.dateTime(new Date(premiumUntil), { dateStyle: "medium" }) : undefined
    const lastRail = entitlement?.lastRail ?? undefined
    const copies = new Map([
        ["monthly", { name: t("monthlyName"), note: t("monthlyNote") }],
        ["yearly", { name: t("yearlyName"), note: t("yearlyNote") }],
    ])
    const other = { name: t("otherName"), note: t("otherNote") }
    const plans = mapSlot(slotOfSwr(read), (offers): ReadonlyArray<PlanOption> =>
        offers.map((offer) => ({
            id: offer.plan,
            ...(copies.get(offer.plan) ?? other),
            priceText: format.number(offer.amountVnd, { style: "currency", currency: offer.currency }),
        })),
    )
    const rails: ReadonlyArray<RailOption> = [
        { id: "sepay", name: t("railSepay"), hint: railHint("sepay", lastRail, t) },
        { id: "payos", name: t("railPayos"), hint: railHint("payos", lastRail, t) },
    ]
    const selectedPlan = chosenPlan ?? ("items" in plans ? preferredPlan(plans.items) : "")
    const failures = new Map([
        ["session", t("failureSession")],
        ["refused", t("failureRefused")],
        ["other", t("failureOther")],
    ])
    return (
        <PremiumPlansBase
            shape={shapeOf(session.status === "signed-out", until !== undefined)}
            props={{
                plans,
                slotLabels: { ...slotLabels(t("empty")), error: t("unavailable") },
                rails,
                selectedPlan,
                selectedRail: chosenRail ?? lastRail ?? DEFAULT_RAIL,
                isStarting: checkout.isStarting,
                isStartAvailable: isSignedIn && selectedPlan !== "",
                failureText: checkout.failure === undefined ? undefined : failures.get(checkout.failure),
                notice:
                    until === undefined
                        ? undefined
                        : {
                              title: t("premiumTitle", { date: until }),
                              description: t("premiumDescription", { date: until }),
                          },
                labels: labelsOf(t, until),
            }}
            on={{
                selectPlan: setChosenPlan,
                selectRail: setChosenRail,
                retry: () => void read.mutate(),
                start: () => checkout.start(selectedPlan, chosenRail ?? lastRail),
                signIn: () => setSignInOpen(true),
            }}
        />
    )
}
