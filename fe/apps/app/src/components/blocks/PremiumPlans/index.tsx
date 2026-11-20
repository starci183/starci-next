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
    type ComparisonRow,
    type FaqRow,
    type PlanOption,
    type PremiumPlansLabels,
    type PremiumPlansShape,
} from "./component"

/** The translator of this block's catalog namespace. */
type PlansTranslator = ReturnType<typeof useTranslations<"app.plans">>

/** The plan proposed first: the yearly offer when the server lists it, otherwise the first listed. */
const preferredPlan = (plans: ReadonlyArray<PlanOption>): string =>
    plans.find((plan) => plan.id === "yearly")?.id ?? plans[0]?.id ?? ""

/** The drawing the reader's session and entitlement select. */
const shapeOf = (isSignedOut: boolean, hasTerm: boolean): PremiumPlansShape => {
    if (isSignedOut) return "signedOut"
    return hasTerm ? "premium" : "ready"
}

/** The learning areas of the comparison: what each holds and what the free plan keeps. */
const comparisonOf = (t: PlansTranslator): ReadonlyArray<ComparisonRow> => [
    { id: "harness", title: t("area.harness.title"), text: t("area.harness.text"), free: "yes", premium: "yes" },
    {
        id: "essentials1",
        title: t("area.essentials1.title"),
        text: t("area.essentials1.text"),
        free: "yes",
        premium: "yes",
    },
    {
        id: "essentials2",
        title: t("area.essentials2.title"),
        text: t("area.essentials2.text"),
        free: "locked",
        premium: "yes",
    },
    { id: "projects", title: t("area.projects.title"), text: t("area.projects.text"), free: "locked", premium: "yes" },
    { id: "practice", title: t("area.practice.title"), text: t("area.practice.text"), free: "yes", premium: "yes" },
    {
        id: "devices",
        title: t("area.devices.title"),
        text: t("area.devices.text"),
        free: t("area.devices.free"),
        premium: t("area.devices.premium"),
    },
]

/** The quick questions and their answers. */
const faqOf = (t: PlansTranslator): ReadonlyArray<FaqRow> =>
    ["pay", "renew", "expire"].map((key) => ({
        id: key,
        question: t(`faq.${key}.question`),
        answer: t(`faq.${key}.answer`),
    }))

/** The words of the screen; `until` is the formatted end of an active term, when the reader has one. */
const labelsOf = (t: PlansTranslator, until: string | undefined, rail: string | undefined): PremiumPlansLabels => ({
    title: t("title"),
    meta: until === undefined ? t("metaFree") : t("metaPremium", { date: until }),
    compareTitle: t("compareTitle"),
    compareLabel: t("compareLabel"),
    areaColumn: t("areaColumn"),
    freeColumn: t("freeColumn"),
    premiumColumn: t("premiumColumn"),
    yes: t("yes"),
    locked: t("locked"),
    faqTitle: t("faqTitle"),
    planLegend: t("planLegend"),
    summaryLabel: t("summaryLabel"),
    payWithLabel: t("payWithLabel"),
    payWithValue: t("payWithValue", { rail: rail === "payos" ? t("railPayos") : t("railSepay") }),
    renewLabel: t("renewLabel"),
    renewValue: t("renewValue"),
    totalLabel: t("totalLabel"),
    payNote: until === undefined ? t("payNote") : t("payNoteExtend", { date: until }),
    failureTitle: t("failureTitle"),
    startLabel: until === undefined ? t("startLabel") : t("extendLabel"),
    startingLabel: t("startingLabel"),
    startUnavailable: t("startUnavailable"),
    signInLabel: t("signInLabel"),
})

/** The Premium plans screen: reads the offers and the reader's entitlement, holds the plan choice, starts a checkout. */
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
    const entitlement = mine.data
    const premiumUntil = entitlement?.isPremium === true ? entitlement.premiumUntil : undefined
    const until = premiumUntil ? format.dateTime(new Date(premiumUntil), { dateStyle: "medium" }) : undefined
    const lastRail = entitlement?.lastRail ?? undefined
    const copies = new Map([
        ["monthly", { name: t("monthlyName"), note: t("monthlyNote"), tag: undefined }],
        ["yearly", { name: t("yearlyName"), note: t("yearlyNote"), tag: t("yearlyTag") }],
    ])
    const other = { name: t("otherName"), note: t("otherNote"), tag: undefined }
    const plans = mapSlot(slotOfSwr(read), (offers): ReadonlyArray<PlanOption> =>
        offers.map((offer) => ({
            id: offer.plan,
            ...(copies.get(offer.plan) ?? other),
            priceText: format.number(offer.amountVnd, { style: "currency", currency: offer.currency }),
        })),
    )
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
                comparison: comparisonOf(t),
                faq: faqOf(t),
                selectedPlan,
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
                labels: labelsOf(t, until, lastRail),
            }}
            on={{
                selectPlan: setChosenPlan,
                retry: () => void read.mutate(),
                start: () => checkout.start(selectedPlan, lastRail),
                signIn: () => setSignInOpen(true),
            }}
        />
    )
}
