import type { DataSlot } from "@starci-next/ui"

/** The identity of the learner as it is drawn: the name, the avatar and the goal path, in words. */
export type ProfileIdentityView = {
    /** The name that shows: the one the learner chose, else the name of their account. */
    readonly shownName: string
    /** What the name field holds now. */
    readonly nameValue: string
    readonly avatarUrl: string | null
    readonly goalTitle: string | null
    readonly canSaveName: boolean
}

/** One verified CV line with its proof link. */
export type ProfileCvLine = {
    readonly itemId: string
    readonly part: string
    readonly line: string
    readonly signed: string
    readonly evidence: string
    readonly proofHref: string
}

/** The verified CV lines and what still waits. */
export type ProfileCvView = {
    /** The line under the list: the verified count against the hiring threshold, and what waits for review. */
    readonly note: string
    readonly lines: ReadonlyArray<ProfileCvLine>
}

/** One paired device in words. */
export type ProfileDeviceView = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isOnline: boolean
}

/** One MCP token in words. */
export type ProfileTokenView = { readonly id: string; readonly name: string; readonly detail: string }

/** The plan of the learner in words. */
export type ProfilePlanView = { readonly isPremium: boolean; readonly status: string; readonly note: string }

/** One public verification link. */
export type ProfileVerifyLink = {
    readonly itemId: string
    readonly title: string
    readonly url: string
    readonly isPublic: boolean
    readonly isCopied: boolean
}

/** The fixed words of the profile. */
export type ProfileHubLabels = {
    readonly title: string
    readonly description: string
    readonly identityTitle: string
    readonly avatarLabel: string
    readonly upload: string
    readonly remove: string
    readonly avatarHint: string
    readonly nameLabel: string
    readonly namePlaceholder: string
    readonly nameHint: string
    readonly save: string
    readonly saved: string
    readonly issue: string
    readonly goalTitle: string
    readonly goalNone: string
    readonly goalChoose: string
    readonly goalChange: string
    readonly goalHref: string
    readonly cvTitle: string
    readonly cvCaption: string
    readonly cvSeeAll: string
    readonly cvSeeAllHref: string
    readonly cvEmpty: string
    readonly proof: string
    readonly devicesTitle: string
    readonly devicesManage: string
    readonly devicesHref: string
    readonly devicesEmpty: string
    readonly online: string
    readonly offline: string
    readonly tokensTitle: string
    readonly tokensManage: string
    readonly tokensHref: string
    readonly tokensEmpty: string
    readonly planTitle: string
    readonly planManage: string
    readonly planHref: string
    readonly verifyTitle: string
    readonly verifyCaption: string
    readonly verifyCopy: string
    readonly verifyCopied: string
    readonly verifyPublic: string
    readonly verifyPrivate: string
    readonly verifyEmpty: string
}

/** The slots of the profile page, one per read, so a part that fails or is hidden does not take the others with it. */
export type ProfileHubViews = {
    readonly identity: DataSlot<ProfileIdentityView>
    readonly cv: DataSlot<ProfileCvView>
    readonly verify: DataSlot<ReadonlyArray<ProfileVerifyLink>>
    readonly devices: DataSlot<ReadonlyArray<ProfileDeviceView>>
    readonly tokens: DataSlot<ReadonlyArray<ProfileTokenView>>
    readonly plan: DataSlot<ProfilePlanView>
}
