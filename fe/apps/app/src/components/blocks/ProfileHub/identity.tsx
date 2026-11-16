import { Avatar, Button, Cluster, FileButton, Input, Link, Section, Text } from "@starci/grammar/common"
import { SlotView } from "@starci-next/ui"
import type { DataSlot, ProfileHubLabels, ProfileIdentityView, SlotLabels } from "@/modules/types"
import { IDENTITY_PLACEHOLDER } from "./placeholders"

/** What the identity part is drawn from. */
export type IdentitySectionProps = {
    readonly props: {
        readonly labels: ProfileHubLabels
        readonly slotLabels: SlotLabels
        readonly identity: DataSlot<ProfileIdentityView>
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
        readonly retry: () => void
    }
}

/** What the avatar row is drawn from. */
type AvatarRowProps = {
    readonly labels: ProfileHubLabels
    readonly identity: ProfileIdentityView
    readonly accept: string
    readonly isUploading: boolean
    readonly isRemoving: boolean
    readonly onUpload: (file: File) => void
    readonly onRemove: () => void
}

/** The avatar with the commands that change it; the hint or the issue stands under the picker. */
const AvatarRow = (props: AvatarRowProps) => (
    <Cluster gap="inline" align="center" wrap>
        <Avatar
            name={props.identity.shownName}
            size="lg"
            {...(props.identity.avatarUrl === null ? {} : { src: props.identity.avatarUrl })}
        />
        <FileButton
            text={props.labels.upload}
            label={props.labels.avatarLabel}
            accept={props.accept}
            isDisabled={props.isUploading}
            description={props.labels.avatarHint}
            {...(props.labels.issue === "" ? {} : { errorMessage: props.labels.issue })}
            onFilesChange={(files) => {
                const [file] = files
                if (file !== undefined) props.onUpload(file)
            }}
        />
        {props.identity.avatarUrl === null ? null : (
            <Button intent="neutral" isPending={props.isRemoving} onPress={props.onRemove}>
                {props.labels.remove}
            </Button>
        )}
    </Cluster>
)

/** What the name row is drawn from. */
type NameRowProps = {
    readonly labels: ProfileHubLabels
    readonly identity: ProfileIdentityView
    readonly isSaving: boolean
    readonly isSaved: boolean
    readonly onChange: (value: string) => void
    readonly onSave: () => void
}

/** The name field with its save command. */
const NameRow = (props: NameRowProps) => (
    <Cluster gap="inline" align="end" wrap>
        <Input
            id="profile-display-name"
            name="displayName"
            label={props.labels.nameLabel}
            placeholder={props.labels.namePlaceholder}
            description={props.labels.nameHint}
            value={props.identity.nameValue}
            onValueChange={props.onChange}
        />
        <Button
            intent="neutral"
            isDisabled={!props.identity.canSaveName}
            isPending={props.isSaving}
            onPress={props.onSave}
        >
            {props.labels.save}
        </Button>
        {props.isSaved ? (
            <Text size="sm" tone="muted">
                {props.labels.saved}
            </Text>
        ) : null}
    </Cluster>
)

/** What the goal row is drawn from. */
type GoalRowProps = { readonly labels: ProfileHubLabels; readonly identity: ProfileIdentityView }

/** The goal path of the learner with the link that chooses or changes it. */
const GoalRow = (props: GoalRowProps) => (
    <Cluster gap="inline" align="center" justify="between" wrap>
        <Text isStrong>{`${props.labels.goalTitle}: ${props.identity.goalTitle ?? props.labels.goalNone}`}</Text>
        <Link variant="plain" href={props.labels.goalHref}>
            {props.identity.goalTitle === null ? props.labels.goalChoose : props.labels.goalChange}
        </Link>
    </Cluster>
)

/** The identity: the avatar, the name and the goal path. */
export const IdentitySection = (props: IdentitySectionProps) => {
    const { labels, accept, isSaving, isSaved, isUploading, isRemoving } = props.props
    return (
        <SlotView
            slot={props.props.identity}
            placeholder={IDENTITY_PLACEHOLDER}
            labels={props.props.slotLabels}
            onRetry={props.on.retry}
            render={(identity, isLoading) => (
                <Section title={labels.identityTitle} headingLevel={2} isLoading={isLoading}>
                    <AvatarRow
                        labels={labels}
                        identity={identity}
                        accept={accept}
                        isUploading={isUploading}
                        isRemoving={isRemoving}
                        onUpload={props.on.uploadAvatar}
                        onRemove={props.on.removeAvatar}
                    />
                    <NameRow
                        labels={labels}
                        identity={identity}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        onChange={props.on.changeName}
                        onSave={props.on.saveName}
                    />
                    <GoalRow labels={labels} identity={identity} />
                </Section>
            )}
        />
    )
}
