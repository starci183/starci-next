"use client"

import { Button, Cluster } from "@starci/grammar/common"
import { BrandLockup } from "@starci-next/ui"
import { LocaleSwitch } from "@/components/blocks/LocaleSwitch"
import { usePublicCvLabels } from "@/hooks/publicCv"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"

/**
 * The top of a page nobody has to sign in to see (the public CV, the verification of a line): the brand, the language and the way in,
 * which opens the sign-in modal like the guest avatar of the app does. It is the only chrome of such a page.
 */
export const PublicTopBar = () => {
    const labels = usePublicCvLabels()
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    return (
        <Cluster gap="row" align="center" justify="between">
            <BrandLockup brand={labels.brand} logoSrc={labels.logoSrc} homeHref={labels.homeHref} size="header" />
            <Cluster gap="inline" align="center">
                <LocaleSwitch />
                <Button intent="neutral" onPress={() => setSignInOpen(true)}>
                    {labels.signIn}
                </Button>
            </Cluster>
        </Cluster>
    )
}
