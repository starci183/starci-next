import { Alert, Button, RadioGroup, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { Icon, SlotView } from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The drawings of the plans screen: the settled reader, a reader who already holds Premium and one who is not signed in. */
export const PREMIUM_PLANS_SHAPES = ["ready", "premium", "signedOut"] as const
/** One drawing per member of {@link PREMIUM_PLANS_SHAPES}. */
export type PremiumPlansShape = (typeof PREMIUM_PLANS_SHAPES)[number]

/** One server-priced offer as the screen draws it: the price text is the server's amount, formatted. */
export interface PlanOption {
    readonly id: string
    readonly name: string
    readonly priceText: string
    readonly note: string
}

/** One checkout rail the reader may pay on. */
export interface RailOption {
    readonly id: string
    readonly name: string
    readonly hint: string | undefined
}

/** Blank widths that give the skeleton its box: non-breaking spaces carry no readable text into the page or the accessibility tree. */
const SKELETON_NAME = " ".repeat(18)
const SKELETON_PRICE = " ".repeat(12)
const SKELETON_NOTE = " ".repeat(30)

/** Two offers of the same shape as the read: the skeleton draws the ready tree from them. */
export const PLANS_PLACEHOLDER: ReadonlyArray<PlanOption> = [
    { id: "placeholder-a", name: SKELETON_NAME, priceText: SKELETON_PRICE, note: SKELETON_NOTE },
    { id: "placeholder-b", name: SKELETON_NAME, priceText: SKELETON_PRICE, note: SKELETON_NOTE },
]

/** The words the screen shows, resolved by the connected half. */
export interface PremiumPlansLabels {
    readonly includesTitle: string
    readonly benefits: ReadonlyArray<string>
    readonly expiryNote: string
    readonly planLegend: string
    readonly railLegend: string
    readonly summaryLabel: string
    readonly failureTitle: string
    readonly payNote: string
    readonly startLabel: string
    readonly startingLabel: string
    readonly startUnavailable: string
    readonly signInLabel: string
}

/** Everything the plans screen takes: atoms, one slot for the one read, and the actions that answer the reader's choices. */
export interface PremiumPlansBaseProps {
    readonly shape: PremiumPlansShape
    readonly props: {
        readonly plans: DataSlot<ReadonlyArray<PlanOption>>
        readonly slotLabels: SlotLabels
        readonly rails: ReadonlyArray<RailOption>
        readonly selectedPlan: string
        readonly selectedRail: string
        readonly isStarting: boolean
        readonly isStartAvailable: boolean
        /** The resolved reason the last start did not reach the gateway, or undefined. */
        readonly failureText: string | undefined
        /** The already-Premium notice (title and the "adds on from" sentence), or undefined for a reader without an active term. */
        readonly notice: { readonly title: string; readonly description: string } | undefined
        readonly labels: PremiumPlansLabels
    }
    readonly on: {
        readonly selectPlan: (id: string) => void
        readonly selectRail: (id: string) => void
        readonly retry: () => void
        readonly start: () => void
        /** Opens the sign-in modal: buying needs a session, the plans do not. */
        readonly signIn: () => void
    }
}

/** What the includes card reads: only the words. */
interface IncludesProps {
    readonly labels: PremiumPlansLabels
}

const Includes = (props: IncludesProps) => (
    <SurfaceCard label={props.labels.includesTitle}>
        <Stack gap="row">
            {props.labels.benefits.map((benefit) => (
                <Text key={benefit} startContent={<Icon />}>
                    {benefit}
                </Text>
            ))}
            <Text size="sm" tone="muted">
                {props.labels.expiryNote}
            </Text>
        </Stack>
    </SurfaceCard>
)

/** What the commit reads: the drawing, the start flags and the words. */
interface CommitProps {
    readonly shape: PremiumPlansShape
    readonly isStarting: boolean
    readonly isStartAvailable: boolean
    readonly labels: PremiumPlansLabels
    readonly onStart: () => void
    readonly onSignIn: () => void
}

const Commit = (props: CommitProps) => {
    switch (props.shape) {
        case "signedOut":
            return (
                <Button intent="commit" width="fill-narrow" onPress={props.onSignIn}>
                    {props.labels.signInLabel}
                </Button>
            )
        case "ready":
        case "premium":
            return (
                <Button
                    intent="commit"
                    width="fill-narrow"
                    isPending={props.isStarting}
                    onPress={props.onStart}
                    isDisabled={!props.isStartAvailable}
                    disabledReason={props.labels.startUnavailable}
                >
                    {props.isStarting ? props.labels.startingLabel : props.labels.startLabel}
                </Button>
            )
    }
}

/** What the choices read: the whole screen's inputs, the offers the slot settled on and whether they are the skeleton's. */
type ChoicesProps = PremiumPlansBaseProps & { readonly plans: ReadonlyArray<PlanOption>; readonly isLoading: boolean }

const Choices = (props: ChoicesProps) => {
    const { labels } = props.props
    const chosen = props.plans.find((plan) => plan.id === props.props.selectedPlan) ?? props.plans[0]
    const rail = props.props.rails.find((one) => one.id === props.props.selectedRail)
    return (
        <Stack gap="section">
            <RadioGroup
                label={labels.planLegend}
                appearance="rows"
                orientation="horizontal"
                isLoading={props.isLoading}
                value={props.props.selectedPlan}
                onValueChange={props.on.selectPlan}
                options={props.plans.map((plan) => ({
                    value: plan.id,
                    label: `${plan.name} · ${plan.priceText}`,
                    description: plan.note,
                }))}
            />
            <RadioGroup
                label={labels.railLegend}
                appearance="rows"
                orientation="horizontal"
                value={props.props.selectedRail}
                onValueChange={props.on.selectRail}
                options={props.props.rails.map((one) => ({ value: one.id, label: one.name, description: one.hint }))}
            />
            <SurfaceCard ariaLabel={labels.summaryLabel} isLoading={props.isLoading}>
                <Stack gap="row">
                    <Text tone="muted" isLoading={props.isLoading}>
                        {`${chosen?.name ?? ""} · ${rail?.name ?? ""}`}
                    </Text>
                    <Text isStrong isLoading={props.isLoading}>
                        {chosen?.priceText ?? ""}
                    </Text>
                    <Text size="sm" tone="muted">
                        {labels.payNote}
                    </Text>
                    <Commit
                        shape={props.shape}
                        isStarting={props.props.isStarting}
                        isStartAvailable={props.props.isStartAvailable}
                        labels={labels}
                        onStart={props.on.start}
                        onSignIn={props.on.signIn}
                    />
                </Stack>
            </SurfaceCard>
        </Stack>
    )
}

/**
 * Draws the Premium plans screen from atoms: what Premium includes, then the server-priced plans with their rail and one commit. The plans read draws its status through SlotView.
 */
export const PremiumPlansBase = (props: PremiumPlansBaseProps) => (
    <Stack gap="section">
        {props.props.notice === undefined ? null : (
            <Alert tone="informative" title={props.props.notice.title} description={props.props.notice.description} />
        )}
        {props.props.failureText === undefined ? null : (
            <Alert tone="negative" title={props.props.labels.failureTitle} description={props.props.failureText} />
        )}
        <Includes labels={props.props.labels} />
        <SlotView
            slot={props.props.plans}
            placeholder={PLANS_PLACEHOLDER}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(plans, isLoading) => <Choices {...props} plans={plans} isLoading={isLoading} />}
        />
    </Stack>
)
