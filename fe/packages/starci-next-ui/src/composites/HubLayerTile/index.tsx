import { SurfaceCard } from "@starci/grammar/common"

/** One of the three layers of the hub (goal, profile and CV, hiring connections); a layer has no streak. */
export type HubLayerView = {
    readonly id: string
    readonly title: string
    readonly body: string
    readonly href: string
}

/** A layer as one peer tile. */
type HubLayerTileProps = {
    readonly layer: HubLayerView
    /** The words of the whole-tile link. */
    readonly openLabel: string
}

/** One layer tile: its name, one line on what it holds and the link that opens it. */
export const HubLayerTile = (props: HubLayerTileProps) => (
    <SurfaceCard
        kind="tile"
        name={props.layer.title}
        description={props.layer.body}
        mark={{ avatar: { name: props.layer.title, seed: props.layer.id } }}
        wholeAction={{ kind: "link", href: props.layer.href, label: props.openLabel }}
    />
)
