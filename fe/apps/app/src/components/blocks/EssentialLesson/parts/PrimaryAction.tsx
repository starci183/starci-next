import { Button, Stack, Text } from "@starci/grammar/common"
import type { EssentialPrimary } from "@/hooks/essentialLesson"

/** The one primary command the header carries for a part: grey with its reason beneath when it cannot be pressed. */
export const PrimaryAction = (props: { readonly primary: EssentialPrimary | undefined }) => {
    const { primary } = props
    if (primary === undefined) return undefined
    return (
        <Stack gap="identity">
            <Button
                intent="commit"
                isDisabled={primary.isDisabled}
                isPending={primary.isPending}
                onPress={primary.onPress}
            >
                {primary.label}
            </Button>
            {primary.reason === "" ? null : (
                <Text tone="muted" size="sm">
                    {primary.reason}
                </Text>
            )}
        </Stack>
    )
}
