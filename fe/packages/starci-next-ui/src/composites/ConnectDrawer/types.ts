/** One install or sign-in step of the pairing guide. */
export type DevicesPairStep = { readonly title: string; readonly command: string | undefined; readonly note: string }

/** One rule of what the CLI may and may not do. */
export type DevicesPairRule = { readonly text: string; readonly isAllowed: boolean }

/** One paired device, already in words. */
export type DevicesPairDevice = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isOnline: boolean
    readonly isRevoking: boolean
}

/** The pending pairing the learner is about to confirm, in words. */
export type DevicesPairPreview = { readonly name: string; readonly detail: string }

/** The fixed words of the devices screen. */
export type DevicesPairLabels = {
    readonly codeLabel: string
    readonly codePlaceholder: string
    readonly codeHint: string
    readonly codeUnknown: string
    readonly previewTitle: string
    readonly confirm: string
    readonly confirming: string
    readonly devicesLimit: string
    readonly online: string
    readonly offline: string
    readonly revoke: string
    readonly rulesTitle: string
    readonly pageHeading: string
    readonly pageSub: string
    readonly connect: string
    readonly connectTitle: string
    readonly pairedTitle: string
    readonly emptyTitle: string
    readonly emptyText: string
    readonly levelsTitle: string
    readonly practiceTitle: string
    readonly practiceText: string
    readonly proofTitle: string
    readonly proofText: string
    readonly closeLabel: string
    readonly allowed: string
    readonly denied: string
}
