import { Button, Divider, Stack } from "@starci/grammar/common"

/** The Google sign-in button as the connected block resolves it; `isPending` is set while the browser leaves for Google. */
type AuthSocialButtonsProps = {
    readonly googleLabel: string
    readonly dividerLabel: string
    readonly isPending: boolean
    readonly pendingLabel: string
    readonly isDisabled: boolean
    readonly onChoose: () => void
}

/** Google, then the "or" divider that leads to the credential form. */
export const AuthSocialButtons = (props: AuthSocialButtonsProps) => (
    <Stack gap="row">
        <Button
            variant="border"
            width="fill"
            isPending={props.isPending}
            isDisabled={props.isDisabled || props.isPending}
            onPress={props.onChoose}
        >
            {props.isPending ? props.pendingLabel : props.googleLabel}
        </Button>
        <Divider label={props.dividerLabel} />
    </Stack>
)
