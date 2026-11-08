import { Page } from "@starci/grammar/common"
import { PremiumPlans } from "@/components/blocks/PremiumPlans"

/** Props for {@link PlansPageBase}. */
export type PlansPageBaseProps = {
    /** The words the page shows. */
    readonly props: { readonly title: string; readonly description: string }
}

/** Draws the Premium plans route: one Page whose header carries the heading and the term promise, and the plans block as its body. */
export const PlansPageBase = (props: PlansPageBaseProps) => (
    <Page header={{ title: props.props.title, description: props.props.description }}>
        <PremiumPlans />
    </Page>
)
