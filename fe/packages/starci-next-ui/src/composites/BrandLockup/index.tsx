import { Cluster, Image, Link } from "@starci/grammar/common"
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

/** The logo (the static brand file, drawn at once and never replaced by an avatar) with the wordmark as one link home: the brand of the app header and of the centred entry screens. */
export const BrandLockup = (props: BrandLockupProps) => {
    return (
        <Cluster gap="row" align="center" wrap={false}>
            <div className={props.size === "entry" ? ENTRY_LOGO_CLASS_NAME : HEADER_LOGO_CLASS_NAME}>
                <Image src={props.logoSrc} alt="" aspect="square" fit="contain" loading="eager" plate="none" />
            </div>
            <Link href={props.homeHref}>{props.brand}</Link>
        </Cluster>
    )
}
