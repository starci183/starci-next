import type { ReactNode } from "react"
import { Grid } from "@starci/grammar/common"

/** What the art slot of a card needs. */
type ArtBesideProps = {
    /** The decorative picture, already drawn at its own aspect; undefined leaves the content alone. */
    readonly art: ReactNode | undefined
    readonly children: ReactNode
}

/** A card's content with a decorative picture beside it on a wide card and under it on a narrow one; the picture's own width and height reserve its box. */
export const ArtBeside = (props: ArtBesideProps): ReactNode =>
    props.art === undefined ? props.children : <Grid kind="pair" leading={props.children} trailing={props.art} />
