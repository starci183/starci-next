import { Skeleton } from "@heroui/react"
import {
    Alert,
    Badge,
    Button,
    DataTable,
    DescriptionList,
    Page,
    Pane,
    PaneGrid,
    PaneSection,
    RadioGroup,
    Section,
    Stack,
    Text,
    type DataTableRow,
} from "@starci/grammar/common"
import { DoneIcon, LockIcon, SlotView } from "@starci-next/ui"
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
    /** The short offer tag of the plan ("Tiết kiệm 2 tháng"), or undefined. */
    readonly tag: string | undefined
}

/** One row of the free-versus-Premium comparison: a learning area, what it holds and what each plan gives. */
export interface ComparisonRow extends DataTableRow {
    readonly title: string
    readonly text: string
    /** `yes` or `locked` draw the mark; any other text is the value itself (a machine count). */
    readonly free: string
    readonly premium: string
}

/** One quick question and its answer. */
export interface FaqRow {
    readonly id: string
    readonly question: string
    readonly answer: string
}

/** Blank widths that give the skeleton its box: non-breaking spaces carry no readable text into the page or the accessibility tree. */
const SKELETON_NAME = " ".repeat(18)
const SKELETON_PRICE = " ".repeat(12)
const SKELETON_NOTE = " ".repeat(30)

/** Two offers of the same shape as the read: the skeleton draws the ready tree from them. */
export const PLANS_PLACEHOLDER: ReadonlyArray<PlanOption> = [
    { id: "placeholder-a", name: SKELETON_NAME, priceText: SKELETON_PRICE, note: SKELETON_NOTE, tag: undefined },
    { id: "placeholder-b", name: SKELETON_NAME, priceText: SKELETON_PRICE, note: SKELETON_NOTE, tag: undefined },
]

/** The words the screen shows, resolved by the connected half. */
export interface PremiumPlansLabels {
    readonly title: string
    /** The one line under the title: the reader's current plan and what stays free. */
    readonly meta: string
    readonly compareTitle: string
    readonly compareLabel: string
    readonly areaColumn: string
    readonly freeColumn: string
    readonly premiumColumn: string
    readonly yes: string
    readonly locked: string
    readonly faqTitle: string
    readonly planLegend: string
    readonly summaryLabel: string
    readonly payWithLabel: string
    readonly payWithValue: string
    readonly renewLabel: string
    readonly renewValue: string
    readonly totalLabel: string
    readonly payNote: string
    readonly failureTitle: string
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
        readonly comparison: ReadonlyArray<ComparisonRow>
        readonly faq: ReadonlyArray<FaqRow>
        readonly selectedPlan: string
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
        readonly retry: () => void
        readonly start: () => void
        /** Opens the sign-in modal: buying needs a session, the plans do not. */
        readonly signIn: () => void
    }
}

/** What a comparison cell reads: the value and the two marks' words. */
interface MarkProps {
    readonly value: string
    readonly labels: PremiumPlansLabels
}

const Mark = (props: MarkProps) => {
    if (props.value === "yes")
        return <Text startContent={<DoneIcon label={props.labels.yes} />}>{props.labels.yes}</Text>
    if (props.value === "locked")
        return (
            <Text tone="muted" startContent={<LockIcon label={props.labels.locked} />}>
                {props.labels.locked}
            </Text>
        )
    return <Text>{props.value}</Text>
}

/** The commit of the plan card: sign in for a signed-out reader, else start the checkout. */
interface CommitProps {
    readonly shape: PremiumPlansShape
    readonly isStarting: boolean
    readonly isStartAvailable: boolean
    readonly priceText: string
    readonly labels: PremiumPlansLabels
    readonly onStart: () => void
    readonly onSignIn: () => void
}

const Commit = (props: CommitProps) => {
    if (props.shape === "signedOut")
        return (
            <Button intent="commit" width="fill" onPress={props.onSignIn}>
                {props.labels.signInLabel}
            </Button>
        )
    return (
        <Button
            intent="commit"
            width="fill"
            isPending={props.isStarting}
            onPress={props.onStart}
            isDisabled={!props.isStartAvailable}
            disabledReason={props.labels.startUnavailable}
        >
            {props.isStarting ? props.labels.startingLabel : `${props.labels.startLabel} ${props.priceText}`.trim()}
        </Button>
    )
}

/** What the choices read: the whole screen's inputs, the offers the slot settled on and whether they are the skeleton's. */
type ChoicesProps = PremiumPlansBaseProps & { readonly plans: ReadonlyArray<PlanOption>; readonly isLoading: boolean }

const Choices = (props: ChoicesProps) => {
    const { labels } = props.props
    const chosen = props.plans.find((plan) => plan.id === props.props.selectedPlan) ?? props.plans[0]
    return (
        <Section title={labels.planLegend} headingLevel={2}>
            <Stack gap="section">
                <RadioGroup
                    label={labels.planLegend}
                    isLabelHidden
                    appearance="rows"
                    isLoading={props.isLoading}
                    value={props.props.selectedPlan}
                    onValueChange={props.on.selectPlan}
                    options={props.plans.map((plan) => ({
                        value: plan.id,
                        label: (
                            <Stack gap="identity">
                                <Text isStrong>{`${plan.name} · ${plan.priceText}`}</Text>
                                {plan.tag === undefined ? null : <Badge tone="success">{plan.tag}</Badge>}
                            </Stack>
                        ),
                        description: plan.note,
                    }))}
                />
                <DescriptionList
                    isLoading={props.isLoading}
                    items={[
                        { id: "pay", term: labels.payWithLabel, description: labels.payWithValue },
                        { id: "renew", term: labels.renewLabel, description: labels.renewValue },
                        {
                            id: "total",
                            term: labels.totalLabel,
                            description: <Text isStrong>{chosen?.priceText ?? ""}</Text>,
                        },
                    ]}
                />
                <Text size="sm" tone="muted">
                    {labels.payNote}
                </Text>
                <Commit
                    shape={props.shape}
                    isStarting={props.props.isStarting}
                    isStartAvailable={props.props.isStartAvailable}
                    priceText={chosen?.priceText ?? ""}
                    labels={labels}
                    onStart={props.on.start}
                    onSignIn={props.on.signIn}
                />
            </Stack>
        </Section>
    )
}

/** The comparison of what each plan holds, as one flat table; a phone keeps the three columns. */
const Comparison = (props: PremiumPlansBaseProps) => {
    const { labels } = props.props
    return (
        <Section title={labels.compareTitle} headingLevel={2}>
            <DataTable<ComparisonRow>
                label={labels.compareLabel}
                phone="table"
                rows={props.props.comparison}
                emptyContent={null}
                columns={[
                    { id: "area", label: labels.areaColumn, isRowHeader: true },
                    { id: "free", label: labels.freeColumn, width: "fit" },
                    { id: "premium", label: labels.premiumColumn, width: "fit" },
                ]}
                renderCell={(row, columnId) => {
                    if (columnId === "free") return <Mark value={row.free} labels={labels} />
                    if (columnId === "premium") return <Mark value={row.premium} labels={labels} />
                    return (
                        <Stack gap="identity">
                            <Text isStrong>{row.title}</Text>
                            <Text size="sm" tone="muted" overflow="wrap">
                                {row.text}
                            </Text>
                        </Stack>
                    )
                }}
            />
        </Section>
    )
}

/** The quick questions: each question over its answer, the answer in full. */
const Faq = (props: PremiumPlansBaseProps) => (
    <Section title={props.props.labels.faqTitle} headingLevel={2}>
        <DescriptionList
            layout="stacked"
            isDivided
            items={props.props.faq.map((row) => ({ id: row.id, term: row.question, description: row.answer }))}
        />
    </Section>
)

/** One block of the loading page: a bar for its title, then the lines its body will take. */
const SkeletonBlock = (props: { readonly lines: number }) => (
    <Stack gap="row">
        <Skeleton className="h-5 w-40 rounded-md" />
        {Array.from({ length: props.lines }, (_, index) => (
            <Skeleton key={index} className="h-4 w-2/3 rounded-md" />
        ))}
    </Stack>
)

/** The panes while the plans read loads: the comparison, the questions and the plan card as bars, with no word, mark or tone. */
const plansSkeleton = (title: string) => (
    <PaneGrid
        label={title}
        areas={{ base: ["aside", "main"], wide: ["main aside"] }}
        columns={{ base: ["fill"], wide: ["fill", "standard"] }}
    >
        <Pane area="main" scroll label={title}>
            <PaneSection>
                <Stack gap="section">
                    <SkeletonBlock lines={8} />
                    <SkeletonBlock lines={6} />
                </Stack>
            </PaneSection>
        </Pane>
        <Pane area="aside" surface scroll label={title}>
            <PaneSection>
                <Stack gap="section">
                    <SkeletonBlock lines={4} />
                    <SkeletonBlock lines={3} />
                    <Skeleton className="h-24 w-full rounded-2xl" />
                </Stack>
            </PaneSection>
        </Pane>
    </PaneGrid>
)

/**
 * Draws the Premium plans screen: the comparison of free and Premium and the quick questions in the main pane, and the plan card
 * (the choice of plan, its summary and one commit) in the side pane. The plans read draws its status through SlotView.
 */
export const PremiumPlansBase = (props: PremiumPlansBaseProps) => {
    const isFirstLoad = "isLoading" in props.props.plans
    return (
        <Page
            chrome="panes"
            header={{ breadcrumbs: "root", title: props.props.labels.title, meta: props.props.labels.meta }}
        >
            {isFirstLoad ? (
                plansSkeleton(props.props.labels.title)
            ) : (
                <PaneGrid
                    label={props.props.labels.title}
                    areas={{ base: ["aside", "main"], wide: ["main aside"] }}
                    columns={{ base: ["fill"], wide: ["fill", "standard"] }}
                >
                    <Pane area="main" scroll label={props.props.labels.compareTitle}>
                        <PaneSection>
                            <Stack gap="section">
                                <Comparison {...props} />
                                <Faq {...props} />
                            </Stack>
                        </PaneSection>
                    </Pane>
                    <Pane area="aside" surface scroll label={props.props.labels.planLegend}>
                        <PaneSection>
                            <Stack gap="section">
                                {props.props.notice === undefined ? null : (
                                    <Alert
                                        tone="informative"
                                        title={props.props.notice.title}
                                        description={props.props.notice.description}
                                    />
                                )}
                                {props.props.failureText === undefined ? null : (
                                    <Alert
                                        tone="negative"
                                        title={props.props.labels.failureTitle}
                                        description={props.props.failureText}
                                    />
                                )}
                                <SlotView
                                    slot={props.props.plans}
                                    placeholder={PLANS_PLACEHOLDER}
                                    labels={props.props.slotLabels}
                                    onRetry={props.on.retry}
                                    render={(plans, isLoading) => (
                                        <Choices {...props} plans={plans} isLoading={isLoading} />
                                    )}
                                />
                            </Stack>
                        </PaneSection>
                    </Pane>
                </PaneGrid>
            )}
        </Page>
    )
}
