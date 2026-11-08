import { AlertDialog, Button, Grid, Page, Stack, Text } from "@starci/grammar/common"
import {
    ART,
    ArtImage,
    CatalogIntro,
    OutcomePathCard,
    OutcomePathDialog,
    SlotView,
    type OutcomePathCardLabels,
    type OutcomePathDetailView,
    type OutcomePathDialogLabels,
    type OutcomePathView,
} from "@starci-next/ui"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** The goal screen as it is drawn, every word resolved. */
export type PathsScreenView = {
    readonly cards: ReadonlyArray<OutcomePathView>
    readonly details: ReadonlyArray<OutcomePathDetailView>
}

/** The fake paths with the geometry of settled ones, drawn as skeletons while the first read runs. */
export const PATHS_PLACEHOLDER: PathsScreenView = {
    cards: [1, 2, 3, 4, 5].map((index) => ({
        id: `placeholder-${index}`,
        kind: "xxxxxxxx",
        title: "xxxxxxxxxx",
        pitch: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        done: "xxxxxxxxxxxxxxxxxxxxxxxx",
        parts: ["xxxxxx", "xxxxxx", "xxxxxx"],
        meta: "xxxxxxxxxxxx",
        isCurrent: false,
    })),
    details: [],
}

/** The fixed words of the page. */
export type PathsLabels = {
    readonly empty: string
    readonly intro: { readonly eyebrow: string; readonly title: string; readonly description: string }
    /** The stage names in the order the paths string them, shown as facts under the intro. */
    readonly stages: ReadonlyArray<string>
    /** The note that a goal holds no streak and no experience of its own. */
    readonly note: string
    readonly card: OutcomePathCardLabels
    readonly dialog: OutcomePathDialogLabels
    /** The confirmation before the learner moves from one path to another. */
    readonly switchConfirm: {
        readonly title: string
        readonly body: string
        readonly confirm: string
        readonly cancel: string
    }
    readonly signedOut: { readonly title: string; readonly body: string; readonly action: string }
}

/** Props for {@link PathsChooseBase}. */
export type PathsChooseBaseProps = {
    readonly props: {
        readonly slot: DataSlot<PathsScreenView>
        readonly placeholder: PathsScreenView
        readonly slotLabels: SlotLabels
        readonly labels: PathsLabels
        /** The path whose dialog is open. */
        readonly openId: string | undefined
        /** The path the learner is asked to confirm a switch to. */
        readonly confirmId: string | undefined
        /** The learner follows a path already, so choosing another one is a switch. */
        readonly hasActive: boolean
        readonly isPending: boolean
        /** The result of the last choice in words; empty when nothing happened. */
        readonly status: string
        readonly signInHref: string
    }
    readonly on: {
        readonly retry: () => void
        readonly view: (id: string) => void
        readonly viewClose: () => void
        readonly choose: (id: string) => void
        readonly confirm: () => void
        readonly cancel: () => void
    }
}

/** The sign-in command shown to a reader who is not signed in. */
const SignInAction = (props: Pick<PathsChooseBaseProps["props"], "labels" | "signInHref">) => (
    <Button intent="commit" href={props.signInHref}>
        {props.labels.signedOut.action}
    </Button>
)

/**
 * Draws the goal screen the way the canvas does: the intro with the stages every path strings together and the teacher beside it, the five
 * outcome paths as peer cards, each with the dialog that opens its done outcome, checks and stages, and the confirmation before a
 * switch. Data status (loading, error with retry, signed out) belongs to the slot.
 */
export const PathsChooseBase = (props: PathsChooseBaseProps) => {
    const { slot, placeholder, slotLabels, labels, openId, confirmId, hasActive, isPending, status } = props.props
    return (
        <Page>
            <SlotView
                slot={slot}
                placeholder={placeholder}
                labels={{ ...slotLabels, forbidden: labels.signedOut.title }}
                forbiddenDescription={labels.signedOut.body}
                forbiddenAction={<SignInAction labels={labels} signInHref={props.props.signInHref} />}
                onRetry={props.on.retry}
                render={(view, isLoading) => (
                    <Stack gap="region">
                        <CatalogIntro
                            {...labels.intro}
                            facts={labels.stages}
                            art={<ArtImage asset={ART.teacher} />}
                            upsell={undefined}
                        />
                        <Text tone="muted">{labels.note}</Text>
                        {status === "" ? null : (
                            <Text as="p" live="polite">
                                {status}
                            </Text>
                        )}
                        <Grid kind="cards">
                            {view.cards.map((path) => (
                                <OutcomePathCard
                                    key={path.id}
                                    path={path}
                                    hasActive={hasActive}
                                    labels={labels.card}
                                    isPending={isPending}
                                    isLoading={isLoading}
                                    onView={props.on.view}
                                    onChoose={props.on.choose}
                                />
                            ))}
                        </Grid>
                        <OutcomePathDialog
                            path={view.details.find((detail) => detail.id === openId)}
                            hasActive={hasActive}
                            labels={labels.dialog}
                            isPending={isPending}
                            onOpenChange={(isOpen) => {
                                if (!isOpen) props.on.viewClose()
                            }}
                            onChoose={props.on.choose}
                        />
                        <AlertDialog
                            isOpen={confirmId !== undefined}
                            onOpenChange={(isOpen) => {
                                if (!isOpen) props.on.cancel()
                            }}
                            title={labels.switchConfirm.title}
                            description={labels.switchConfirm.body}
                            tone="informative"
                            confirmLabel={labels.switchConfirm.confirm}
                            cancelLabel={labels.switchConfirm.cancel}
                            isConfirmPending={isPending}
                            onConfirm={props.on.confirm}
                        />
                    </Stack>
                )}
            />
        </Page>
    )
}
