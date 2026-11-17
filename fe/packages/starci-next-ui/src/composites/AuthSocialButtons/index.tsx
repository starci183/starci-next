import { Button, Divider, Stack } from "@starci/grammar/common"

/** The providers the screen offers. */
export type AuthSocialProvider = "facebook" | "github"

/** The social sign-in buttons as the connected block resolves them; `pendingProvider` is the one being redirected to. */
type AuthSocialButtonsProps = {
    readonly facebookLabel: string
    readonly githubLabel: string
    readonly dividerLabel: string
    readonly pendingProvider: AuthSocialProvider | undefined
    readonly pendingLabel: string
    readonly isDisabled: boolean
    readonly onChoose: (provider: AuthSocialProvider) => void
}

/** One provider button: pending with its redirect words when chosen, disabled while the other one is. */
type ProviderButtonProps = {
    readonly provider: AuthSocialProvider
    readonly label: string
    readonly pendingLabel: string
    readonly pendingProvider: AuthSocialProvider | undefined
    readonly isDisabled: boolean
    readonly onChoose: (provider: AuthSocialProvider) => void
}

/** A provider button, pending when it is the chosen one and disabled while another provider is being redirected to. */
const ProviderButton = (props: ProviderButtonProps) => {
    const isChosen = props.pendingProvider === props.provider
    return (
        <Button
            intent="alternative"
            width="fill"
            isPending={isChosen}
            isDisabled={props.isDisabled || (props.pendingProvider !== undefined && !isChosen)}
            onPress={() => props.onChoose(props.provider)}
        >
            {isChosen ? props.pendingLabel : props.label}
        </Button>
    )
}

/** Facebook and GitHub, then the "or" divider that leads to the credential form. */
export const AuthSocialButtons = (props: AuthSocialButtonsProps) => (
    <Stack gap="row">
        <ProviderButton
            provider="facebook"
            label={props.facebookLabel}
            pendingLabel={props.pendingLabel}
            pendingProvider={props.pendingProvider}
            isDisabled={props.isDisabled}
            onChoose={props.onChoose}
        />
        <ProviderButton
            provider="github"
            label={props.githubLabel}
            pendingLabel={props.pendingLabel}
            pendingProvider={props.pendingProvider}
            isDisabled={props.isDisabled}
            onChoose={props.onChoose}
        />
        <Divider label={props.dividerLabel} />
    </Stack>
)
