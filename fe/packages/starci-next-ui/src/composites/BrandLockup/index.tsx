import { Cluster, Link, Text } from "@starci/grammar/common"
import { ENTRY_LOGO_CLASS_NAME, HEADER_LOGO_CLASS_NAME } from "./classNames"

/** What the lockup is given: the wordmark, the logo file, where it leads and its size. */
type BrandLockupProps = {
    /** The wordmark, also the destination's name. */
    readonly brand: string
    /** The logo file the app serves. */
    readonly logoSrc: string
    /** The destination: the app's front door. */
    readonly homeHref: string
    /** `header` is the small mark beside the wordmark; `entry` is the large mark centred above an auth card. */
    readonly size: "header" | "entry"
}

/** The logo (the static brand file, drawn at once and never replaced by an avatar) as the link home, named by the wordmark, with the wordmark beside it in the strong weight (a brand is not an inline link, so it carries no anchor arrow). */
export const BrandLockup = (props: BrandLockupProps) => (
    <Cluster gap="row" align="center" wrap={false}>
        <div className={props.size === "entry" ? ENTRY_LOGO_CLASS_NAME : HEADER_LOGO_CLASS_NAME}>
            <Link
                href={props.homeHref}
                label={props.brand}
                media={{ src: props.logoSrc, alt: "", aspect: "square", fit: "contain", loading: "eager", plate: "none" }}
            />
        </div>
        <Text isStrong>{props.brand}</Text>
    </Cluster>
)
