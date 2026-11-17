import { Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** Props for {@link SocialCallbackStatusBase}. */
export interface SocialCallbackStatusBaseProps {
    readonly props: { readonly status: string }
}

/** Draws the card that tells the reader the provider sign-in is being finished. */
export const SocialCallbackStatusBase = (props: SocialCallbackStatusBaseProps) => (
    <SurfaceCard ariaLabel={props.props.status} measure="formCompact">
        <Stack gap="row">
            <Text live="polite">{props.props.status}</Text>
        </Stack>
    </SurfaceCard>
)
