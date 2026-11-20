import {
    Button,
    DescriptionList,
    EmptyNotice,
    Page,
    Spinner,
    Stack,
    Text,
    type BreadcrumbItem,
    type PageHeaderContent,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import { RESULT_ACTIONS_CLASS_NAME, RESULT_COLUMN_CLASS_NAME, RESULT_PENDING_CLASS_NAME } from "./classNames"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The drawings of the checkout result: what the server says about the order, that it cannot be found, or that the reader must sign in to ask. */
export const CHECKOUT_RESULT_SHAPES = ["verifying", "active", "failed", "expired", "notFound", "signedOut"] as const
/** One drawing per member of {@link CHECKOUT_RESULT_SHAPES}. */
export type CheckoutResultShape = (typeof CHECKOUT_RESULT_SHAPES)[number]

/** One destination the result offers. */
export interface ResultAction {
    readonly label: string
    readonly href: string
}

/** One fact of the order the server reported (code, plan, amount, rail, the end of the term). */
export interface ResultFact {
    readonly id: string
    readonly term: string
    readonly description: string
}

/** What the settled read draws: the words, the order facts and the onward destinations of one drawing. */
export interface ResultView {
    readonly title: string
    readonly body: string
    /** The line under the page title: the plan and the state in words. */
    readonly meta: string
    /** The crumb of the order ("Đơn STARCI 8F2K41"), or undefined when no order is named. */
    readonly orderCrumb: string | undefined
    readonly facts: ReadonlyArray<ResultFact>
    readonly commit: ResultAction | undefined
    readonly neutral: ResultAction | undefined
}

/** A view of the same shape as the read: the skeleton draws the ready tree from it. */
export const RESULT_PLACEHOLDER: ResultView = {
    title: " ".repeat(12),
    body: " ".repeat(40),
    meta: " ".repeat(20),
    orderCrumb: undefined,
    facts: [],
    commit: undefined,
    neutral: undefined,
}

/** The shape, the one read as a slot and the retry the connected half supplies; atoms only. */
export interface CheckoutResultBaseProps {
    readonly shape: CheckoutResultShape
    readonly props: {
        readonly pageTitle: string
        readonly trailLabel: string
        readonly plansLabel: string
        readonly plansHref: string
        readonly view: DataSlot<ResultView>
        readonly slotLabels: SlotLabels
    }
    readonly on: { readonly retry: () => void }
}

/** The notice each drawing wears: a finished order is the good news, a failure or an overdue order is the warning, the rest the plain notice. */
const noticeKindOf = (shape: CheckoutResultShape): "clear" | "error" | "plain" => {
    switch (shape) {
        case "active":
            return "clear"
        case "failed":
        case "expired":
            return "error"
        case "verifying":
        case "notFound":
        case "signedOut":
            return "plain"
    }
}

/** What the settled body reads: the drawing, the view and whether it is the skeleton's. */
interface ResultBodyProps {
    readonly shape: CheckoutResultShape
    readonly view: ResultView
    readonly isLoading: boolean
}

const ResultNotice = (props: ResultBodyProps) => {
    const kind = noticeKindOf(props.shape)
    if (props.shape === "verifying")
        return (
            <div className={RESULT_PENDING_CLASS_NAME}>
                <Spinner label={props.view.title} size="lg" />
                <Text isStrong>{props.view.title}</Text>
                <Text tone="muted">{props.view.body}</Text>
            </div>
        )
    if (kind === "clear") return <EmptyNotice isAllClear message={props.view.title} description={props.view.body} />
    return <EmptyNotice isError={kind === "error"} message={props.view.title} description={props.view.body} />
}

const ResultBody = (props: ResultBodyProps) => (
    <div className={RESULT_COLUMN_CLASS_NAME}>
        <Stack gap="section">
            <ResultNotice {...props} />
            {props.view.facts.length > 0 ? (
                <DescriptionList
                    isDivided
                    items={props.view.facts.map((fact) => ({
                        id: fact.id,
                        term: fact.term,
                        description: fact.description,
                    }))}
                    isLoading={props.isLoading}
                />
            ) : null}
            <div className={RESULT_ACTIONS_CLASS_NAME}>
                {props.view.commit === undefined ? null : (
                    <Button intent="commit" href={props.view.commit.href}>
                        {props.view.commit.label}
                    </Button>
                )}
                {props.view.neutral === undefined ? null : (
                    <Button intent="neutral" href={props.view.neutral.href}>
                        {props.view.neutral.label}
                    </Button>
                )}
            </div>
        </Stack>
    </div>
)

/** The band: the trail through Premium to the order, the page title and the plan with the order's state. */
const bandOf = (view: ResultView, props: CheckoutResultBaseProps): PageHeaderContent => {
    const items: ReadonlyArray<BreadcrumbItem> = [
        { id: "premium", label: props.props.plansLabel, href: props.props.plansHref },
        ...(view.orderCrumb === undefined ? [] : [{ id: "order", label: view.orderCrumb }]),
    ]
    return {
        breadcrumbs: { label: props.props.trailLabel, items },
        title: props.props.pageTitle,
        meta: view.meta,
    }
}

/**
 * Draws the checkout result: the page band names the order and its state, the body is one centred column with the notice the
 * server's answer selects, the order facts and one onward destination. It never claims success on its own. The order read
 * renders through SlotView.
 */
export const CheckoutResultBase = (props: CheckoutResultBaseProps) => (
    <SlotView<ResultView, PageHeaderContent>
        slot={props.props.view}
        placeholder={RESULT_PLACEHOLDER}
        labels={props.props.slotLabels}
        onRetry={props.on.retry}
        render={(view, isLoading) => <ResultBody shape={props.shape} view={view} isLoading={isLoading} />}
        header={(view) => bandOf(view, props)}
        headerFallback={{ title: props.props.pageTitle }}
        frame={({ header, body, isLoading }) => (
            <Page header={header} isLoading={isLoading}>
                {body}
            </Page>
        )}
    />
)
