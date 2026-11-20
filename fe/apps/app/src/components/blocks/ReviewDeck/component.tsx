import { Alert, Button, Page, Section, Stack, Text, type PageHeaderContent } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { ReviewDeckScreen, ReviewDeckView } from "@/hooks/reviewHub"

/** Props for {@link ReviewDeckBase}: the resolved screen of one deck. */
export type ReviewDeckBaseProps = {
    readonly props: ReviewDeckScreen["props"]
    readonly on: ReviewDeckScreen["on"]
}

/** The one primary command of the header: add the deck, wait while it is added, or review it once added. */
const Primary = (props: ReviewDeckBaseProps) => {
    const { primary } = props.props
    if ("href" in primary) {
        return (
            <Button intent="commit" href={primary.href}>
                {primary.label}
            </Button>
        )
    }
    if ("isPending" in primary) {
        return (
            <Button intent="commit" isPending isDisabled>
                {primary.label}
            </Button>
        )
    }
    return (
        <Button intent="commit" onPress={props.on.add}>
            {primary.label}
        </Button>
    )
}

/** The sample questions as a flat list of rows; the answers show when the learner reviews. */
const Preview = (props: ReviewDeckBaseProps & { readonly view: ReviewDeckView; readonly isLoading: boolean }) => (
    <Section
        kind="list"
        title={props.props.labels.previewTitle}
        headingLevel={2}
        isLoading={props.isLoading}
        caption={props.props.labels.previewNote}
        items={props.view.samples.map((card) => ({
            id: card.id,
            title: card.question,
            description: card.kind,
        }))}
        empty={null}
    />
)

/** The zone that removes an added deck: what happens to the schedule, and a quiet destructive command. */
const Removal = (props: ReviewDeckBaseProps) => (
    <Section title={props.props.labels.removeTitle} headingLevel={2}>
        <Stack gap="row">
            <Text tone="muted">{props.props.labels.removeText}</Text>
            <Button intent="neutral" isPending={props.props.isRemoving} onPress={props.on.remove}>
                {props.props.labels.remove}
            </Button>
        </Stack>
    </Section>
)

/**
 * Draws one deck: the header with the trail, the facts and the one command (add it, or review it once added), the description, the
 * numbers, three sample questions, and for an added deck the zone that removes it from the queue.
 */
export const ReviewDeckBase = (props: ReviewDeckBaseProps) => {
    const { slot, placeholder, labels } = props.props
    const view = "items" in slot ? slot.items : placeholder
    const hasView = "items" in slot || "isLoading" in slot
    const header: PageHeaderContent = {
        title: hasView ? view.title : labels.decks,
        titleScale: "standard",
        ...(hasView ? { meta: view.meta, actions: <Primary {...props} /> } : {}),
        breadcrumbs: {
            label: labels.breadcrumbs,
            items: [
                { id: "review", label: labels.root, href: props.props.rootHref },
                { id: "decks", label: labels.decks, href: props.props.decksHref },
                ...(hasView ? [{ id: "deck", label: view.title }] : []),
            ],
        },
    }
    return (
        <Page header={header} isLoading={"isLoading" in slot}>
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={props.props.slotLabels}
                errorDescription={labels.errorText}
                onRetry={props.on.retry}
                render={(each, isLoading) => (
                    <Stack gap="region">
                        <Text as="p">{each.description}</Text>
                        <Section
                            kind="figures"
                            ariaLabel={each.title}
                            items={each.figures.map((figure) => ({
                                id: figure.id,
                                term: figure.term,
                                value: figure.value,
                            }))}
                        />
                        <Preview {...props} view={each} isLoading={isLoading} />
                        {each.isAdded ? <Removal {...props} /> : null}
                        {props.props.isFailed ? <Alert tone="negative" title={labels.failed} /> : null}
                    </Stack>
                )}
            />
        </Page>
    )
}
