import { Button, Icon, SurfaceCard } from "@starci/grammar/common"

import { PlayGlyph } from "../../leaves/Icon"

/** The lesson a Premium learner left half way, worded by its block. */
type CatalogContinueProps = {
    readonly title: string
    readonly lessonTitle: string
    /** The phase the learner reached, already in words. */
    readonly phaseLine: string
    readonly action: string
    readonly href: string
    /** `command`: the primary button of the page band; `card`: the lesson in progress as one row of a list card on the well. */
    readonly variant: "command" | "card"
}

/**
 * The "continue" of the catalog. As the band command it is the page's one primary (a leading glyph and the verb); as a card it is a
 * list card whose label sits on the well and whose one row names the lesson and the phase reached and opens it whole.
 */
export const CatalogContinue = (props: CatalogContinueProps) =>
    props.variant === "command" ? (
        <Button intent="commit" href={props.href} startContent={<Icon source={PlayGlyph} />}>
            {props.action}
        </Button>
    ) : (
        <SurfaceCard
            kind="list"
            label={props.title}
            empty={props.phaseLine}
            items={[
                {
                    id: "resume",
                    title: props.lessonTitle,
                    description: props.phaseLine,
                    href: props.href,
                },
            ]}
        />
    )
