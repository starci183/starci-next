import {
    Alert,
    Button,
    DescriptionList,
    Heading,
    Stack,
    SurfaceCard,
    type PresentationState,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
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

/** One fact of the order the server reported (plan, amount, rail, order code, status). */
export interface ResultFact {
    readonly id: string
    readonly term: string
    readonly description: string
}

/** What the settled read draws: the words, the order facts and the onward destinations of one drawing. */
export interface ResultView {
    readonly title: string
    readonly statusTitle: string
    readonly body: string
    readonly facts: ReadonlyArray<ResultFact>
    readonly commit: ResultAction | undefined
    readonly neutral: ResultAction | undefined
}

/** A view of the same shape as the read: the skeleton draws the ready tree from it. */
export const RESULT_PLACEHOLDER: ResultView = {
    title: " ".repeat(12),
    statusTitle: " ".repeat(16),
    body: " ".repeat(40),
    facts: [],
    commit: undefined,
    neutral: undefined,
}

/** The shape, the one read as a slot and the retry the connected half supplies; atoms only. */
export interface CheckoutResultBaseProps {
    readonly shape: CheckoutResultShape
    readonly props: {
        readonly ariaLabel: string
        readonly view: DataSlot<ResultView>
        readonly slotLabels: SlotLabels
    }
    readonly on: { readonly retry: () => void }
}

/** The tone each drawing states: it is the server's answer, never inferred from the return address. */
const toneOf = (shape: CheckoutResultShape): PresentationState => {
    switch (shape) {
        case "verifying":
            return "pending"
        case "active":
            return "affirmative"
        case "failed":
            return "negative"
        case "expired":
        case "notFound":
            return "cautionary"
        case "signedOut":
            return "informative"
    }
}

/** What the settled body reads: the drawing, the view and whether it is the skeleton's. */
interface ResultBodyProps {
    readonly shape: CheckoutResultShape
    readonly view: ResultView
    readonly isLoading: boolean
}

const ResultBody = (props: ResultBodyProps) => (
    <Stack gap="section">
        <Heading level={1} isLoading={props.isLoading}>
            {props.view.title}
        </Heading>
        <Alert
            tone={toneOf(props.shape)}
            title={props.view.statusTitle}
            description={props.view.body}
            isLoading={props.isLoading}
        />
        {props.view.facts.length > 0 ? (
            <DescriptionList items={props.view.facts.map((fact) => ({ ...fact }))} isLoading={props.isLoading} />
        ) : null}
        {props.view.commit === undefined ? null : (
            <Button intent="commit" width="fill" href={props.view.commit.href}>
                {props.view.commit.label}
            </Button>
        )}
        {props.view.neutral === undefined ? null : (
            <Button intent="neutral" width="fill" href={props.view.neutral.href}>
                {props.view.neutral.label}
            </Button>
        )}
    </Stack>
)

/**
 * Draws the checkout result: one compact card whose order read renders through SlotView, with the heading, the order's
 * state as an Alert whose tone is the server's answer, the order facts and the onward destinations. It never claims success
 * on its own.
 */
export const CheckoutResultBase = (props: CheckoutResultBaseProps) => (
    <SurfaceCard ariaLabel={props.props.ariaLabel} measure="formCompact">
        <SlotView
            slot={props.props.view}
            placeholder={RESULT_PLACEHOLDER}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(view, isLoading) => <ResultBody shape={props.shape} view={view} isLoading={isLoading} />}
        />
    </SurfaceCard>
)
