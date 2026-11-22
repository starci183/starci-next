import { Skeleton as HeroSkeleton } from "@heroui/react"
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
        readonly nameIdentity: DataSlot<ProfileIdentityView>
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
                            name={identity.avatarName}
                            size="md"
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
                                variant="border"
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
            forbidden="hide"
            slot={props.props.nameIdentity}
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
                            isLoading={isLoading || props.props.goal.isLoading}
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

/** One field while the editor loads: a bar for its label, the field's box (its own skeleton, label hidden) and a bar for its helper. */
const FieldSkeleton = () => (
    <Stack gap="inline">
        <HeroSkeleton className="h-4 w-28 rounded-md" />
        <HeroSkeleton className="h-10 w-full rounded-xl" />
        <HeroSkeleton className="h-3 w-64 rounded-md" />
    </Stack>
)

/**
 * The editor while its first reads load: no title, label, helper, counter or button word, only the geometry of the three sections as
 * bars (the avatar with its picker, the name and goal fields, the CV link with its copy box and switch row).
 */
const ProfileEditSkeleton = () => (
    <Stack gap="region">
        <Stack gap="row">
            <HeroSkeleton className="h-5 w-40 rounded-md" />
            <Cluster gap="inline" align="center" wrap={false}>
                <HeroSkeleton className="h-12 w-12 shrink-0 rounded-full" />
                <Stack gap="row">
                    <HeroSkeleton className="h-4 w-40 rounded-md" />
                    <HeroSkeleton className="h-3 w-56 rounded-md" />
                </Stack>
            </Cluster>
        </Stack>
        <Stack gap="row">
            <HeroSkeleton className="h-5 w-40 rounded-md" />
            <FieldSkeleton />
            <FieldSkeleton />
        </Stack>
        <Stack gap="row">
            <HeroSkeleton className="h-5 w-40 rounded-md" />
            <HeroSkeleton className="h-10 w-full rounded-xl" />
            <Cluster gap="row" align="center" justify="between" wrap={false}>
                <HeroSkeleton className="h-4 w-48 rounded-md" />
                <HeroSkeleton className="h-[18px] w-8 shrink-0 rounded-full" />
            </Cluster>
        </Stack>
    </Stack>
)

/**
 * Draws the profile editor, the child page "Hồ sơ / Sửa": the avatar (sent to the store on its own, with a confirm before it is
 * removed), the display name and the CV link. Cancel is neutral, Save is the one commit and waits while an image uploads.
 */
export const ProfileEditBase = (props: ProfileEditBaseProps) => {
    const { labels, canSave, isSaving, isRemoveOpen } = props.props
    // While the first read loads the body is one skeleton and the two commands are inert bars: nothing to cancel or save yet.
    const isFirstLoad = "isLoading" in props.props.identity
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
                        {isFirstLoad ? (
                            <>
                                <HeroSkeleton className="h-10 w-28 rounded-full" />
                                <HeroSkeleton className="h-10 w-28 rounded-full" />
                            </>
                        ) : (
                            <>
                                <Button variant="border" onPress={props.on.cancel}>
                                    {labels.cancel}
                                </Button>
                                <Button
                                    variant="primary"
                                    isDisabled={!canSave}
                                    isPending={isSaving}
                                    onPress={props.on.save}
                                >
                                    {labels.saveChanges}
                                </Button>
                            </>
                        )}
                    </Cluster>
                ),
            }}
        >
            {isFirstLoad ? (
                <ProfileEditSkeleton />
            ) : (
                <Stack gap="region">
                    <AvatarSection {...props} />
                    <NameSection {...props} />
                    <CvLinkSection {...props} />
                </Stack>
            )}
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
