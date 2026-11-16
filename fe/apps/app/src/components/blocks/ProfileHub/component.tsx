import { Page, Stack } from "@starci/grammar/common"
import type { ProfileHubLabels, ProfileHubViews, SlotLabels } from "@/modules/types"
import { IdentitySection } from "./identity"
import { CvSection, DevicesSection, PlanSection, TokensSection, VerifySection } from "./sections"

/** Props for {@link ProfileHubBase}. */
export type ProfileHubBaseProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly views: ProfileHubViews
        /** The accepted types of the avatar picker, as a native `accept` list. */
        readonly accept: string
        readonly isSaving: boolean
        readonly isSaved: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly saveName: () => void
        readonly uploadAvatar: (file: File) => void
        readonly removeAvatar: () => void
        readonly copyLink: (itemId: string, url: string) => void
        readonly retry: () => void
    }
}

/**
 * Draws the profile: who the learner is (avatar, name, goal path), the CV lines StarCi verified with their proof links, the public
 * verify links and the account panels (devices, MCP tokens, plan). Every part is a flat section that reads on its own.
 */
export const ProfileHubBase = (props: ProfileHubBaseProps) => {
    const { labels, slotLabels, views } = props.props
    const part = { labels, slotLabels, onRetry: props.on.retry }
    return (
        <Page
            header={{
                title: labels.title,
                titleScale: "standard",
                description: labels.description,
                breadcrumbs: "root",
            }}
        >
            <Stack gap="region">
                <IdentitySection
                    props={{
                        labels,
                        slotLabels,
                        identity: views.identity,
                        accept: props.props.accept,
                        isSaving: props.props.isSaving,
                        isSaved: props.props.isSaved,
                        isUploading: props.props.isUploading,
                        isRemoving: props.props.isRemoving,
                    }}
                    on={props.on}
                />
                <CvSection {...part} slot={views.cv} />
                <VerifySection {...part} slot={views.verify} onCopy={props.on.copyLink} />
                <DevicesSection {...part} slot={views.devices} />
                <TokensSection {...part} slot={views.tokens} />
                <PlanSection {...part} slot={views.plan} />
            </Stack>
        </Page>
    )
}
