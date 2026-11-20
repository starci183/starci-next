import {
    AlertDialog,
    Avatar,
    Button,
    Cluster,
    CopyField,
    FileButton,
    Input,
    Page,
    Section,
    Select,
    Stack,
    Switch,
    Text,
} from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { ProfileEditGoal } from "@/hooks/profile"
import {
    CV_LINK_PLACEHOLDER,
    IDENTITY_PLACEHOLDER,
    type DataSlot,
    type ProfileCvLinkView,
    type ProfileHubLabels,
    type ProfileIdentityView,
    type SlotLabels,
} from "@/modules/types"

/** Props for {@link ProfileEditBase}. */
export type ProfileEditBaseProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly identity: DataSlot<ProfileIdentityView>
        readonly cvLink: DataSlot<ProfileCvLinkView>
        readonly goal: ProfileEditGoal
        /** The accepted types of the avatar picker, as a native `accept` list. */
        readonly accept: string
        readonly isSaving: boolean
        readonly isUploading: boolean
        readonly isRemoving: boolean
        readonly canSave: boolean
        readonly isRemoveOpen: boolean
    }
    readonly on: {
        readonly changeName: (value: string) => void
        readonly changeGoal: (value: string | null) => void
        readonly save: () => void
        readonly cancel: () => void
        readonly uploadAvatar: (file: File) => void
        readonly askRemove: () => void
        readonly cancelRemove: () => void
        readonly confirmRemove: () => void
        readonly setPublic: (isPublic: boolean) => void
        readonly retry: () => void
    }
}

/** The avatar with the commands that change it; while it uploads the picker waits and says so, and the issue stands under it. */
const AvatarSection = (props: ProfileEditBaseProps) => {
    const { labels, slotLabels, accept, isUploading, isRemoving } = props.props
    return (
        <SlotView
            slot={props.props.identity}
            placeholder={IDENTITY_PLACEHOLDER}
            labels={slotLabels}
            onRetry={props.on.retry}
            render={(identity, isLoading) => (
                <Section title={labels.avatarTitle} headingLevel={2} isLoading={isLoading}>
                    <Cluster gap="inline" align="center" wrap>
                        <Avatar
                            name={identity.shownName}
                            size="lg"
                            {...(identity.avatarUrl === null ? {} : { src: identity.avatarUrl })}
                        />
                        <FileButton
                            text={identity.avatarUrl === null ? labels.upload : labels.uploadAnother}
                            label={labels.avatarLabel}
                            accept={accept}
                            isDisabled={isUploading}
                            description={isUploading ? labels.uploading : labels.avatarHint}
                            {...(labels.issue === "" ? {} : { errorMessage: labels.issue })}
                            onFilesChange={(files) => {
                                const [file] = files
                                if (file !== undefined) props.on.uploadAvatar(file)
                            }}
                        />
                        {identity.avatarUrl === null ? null : (
                            <Button
                                intent="neutral"
                                isPending={isRemoving}
                                isDisabled={isUploading}
                                onPress={props.on.askRemove}
                            >
                                {labels.remove}
                            </Button>
                        )}
                    </Cluster>
                </Section>
            )}
        />
    )
}

/** The name field, held to the limit the server states, with its count. */
const NameSection = (props: ProfileEditBaseProps) => {
    const { labels, slotLabels } = props.props
    return (
        <SlotView
            slot={props.props.identity}
            placeholder={IDENTITY_PLACEHOLDER}
            labels={slotLabels}
            onRetry={props.on.retry}
            render={(identity, isLoading) => (
                <Section title={labels.identityTitle} headingLevel={2} isLoading={isLoading}>
                    <Stack gap="row">
                        <Input
                            id="profile-display-name"
                            name="displayName"
                            label={labels.nameLabel}
                            placeholder={labels.namePlaceholder}
                            description={`${identity.nameCount} · ${labels.nameHint}`}
                            value={identity.nameValue}
                            onValueChange={props.on.changeName}
                        />
                        <Select
                            label={props.props.goal.label}
                            description={props.props.goal.hint}
                            placeholder={props.props.goal.placeholder}
                            options={props.props.goal.options}
                            value={props.props.goal.value}
                            onValueChange={props.on.changeGoal}
                            isLoading={props.props.goal.isLoading}
                        />
                    </Stack>
                </Section>
            )}
        />
    )
}

/** The CV link again, so the switch can be set while editing. */
const CvLinkSection = (props: ProfileEditBaseProps) => {
    const { labels, slotLabels } = props.props
    return (
        <SlotView
            slot={props.props.cvLink}
            placeholder={CV_LINK_PLACEHOLDER}
            labels={slotLabels}
            forbidden="hide"
            onRetry={props.on.retry}
            render={(link, isLoading) => (
                <Section title={labels.cvLinkTitle} headingLevel={2} isLoading={isLoading}>
                    {link.verifiedCount === 0 ? (
                        <Text tone="muted">{labels.cvLinkEmpty}</Text>
                    ) : (
                        <Stack gap="row">
                            <CopyField
                                label={labels.cvLinkLabel}
                                isLabelHidden
                                value={link.url}
                                copyLabel={labels.cvLinkCopy}
                                copiedLabel={labels.cvLinkCopied}
                                copyErrorLabel={labels.cvLinkCopyError}
                                isLoading={isLoading}
                            />
                            <Switch
                                label={labels.cvLinkSwitch}
                                description={labels.cvLinkSwitchHint}
                                isSelected={link.isPublic}
                                onSelectedChange={props.on.setPublic}
                                isLoading={isLoading}
                            />
                        </Stack>
                    )}
                </Section>
            )}
        />
    )
}

/**
 * Draws the profile editor, the child page "Hồ sơ / Sửa": the avatar (sent to the store on its own, with a confirm before it is
 * removed), the display name and the CV link. Cancel is neutral, Save is the one commit and waits while an image uploads.
 */
export const ProfileEditBase = (props: ProfileEditBaseProps) => {
    const { labels, canSave, isSaving, isRemoveOpen } = props.props
    return (
        <Page
            header={{
                title: labels.editTitle,
                titleScale: "standard",
                meta: labels.editMeta,
                breadcrumbs: {
                    label: labels.crumbLabel,
                    items: [
                        { id: "profile", label: labels.crumbProfile, href: labels.profileHref },
                        { id: "edit", label: labels.crumbEdit },
                    ],
                },
                actions: (
                    <Cluster gap="inline" align="center">
                        <Button intent="neutral" onPress={props.on.cancel}>
                            {labels.cancel}
                        </Button>
                        <Button intent="commit" isDisabled={!canSave} isPending={isSaving} onPress={props.on.save}>
                            {labels.saveChanges}
                        </Button>
                    </Cluster>
                ),
            }}
        >
            <Stack gap="region">
                <AvatarSection {...props} />
                <NameSection {...props} />
                <CvLinkSection {...props} />
            </Stack>
            <AlertDialog
                title={labels.removeTitle}
                description={labels.removeText}
                tone="cautionary"
                confirmLabel={labels.removeConfirm}
                cancelLabel={labels.removeKeep}
                isOpen={isRemoveOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) props.on.cancelRemove()
                }}
                onConfirm={props.on.confirmRemove}
                onCancel={props.on.cancelRemove}
            />
        </Page>
    )
}
