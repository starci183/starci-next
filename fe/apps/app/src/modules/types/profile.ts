import type { DataSlot } from "@starci-next/ui"

/** The identity of the learner as it is drawn: the name, the email, the avatar and the goal path, in words. */
export type ProfileIdentityView = {
    /** The name that shows: the one the learner chose, else a neutral "no name yet". */
    readonly shownName: string
    /** What the name field holds now. */
    readonly nameValue: string
    readonly email: string
    readonly avatarUrl: string | null
    /** The name the generated avatar is drawn from: the account email, as in the app header, so both show one image. */
    readonly avatarName: string
    readonly goalTitle: string | null
    readonly canSaveName: boolean
    /** Whether the learner has set neither a name nor an avatar yet (the first-visit head says "Thêm ảnh và tên"). */
    readonly isNew: boolean
    /** How many characters the name holds and the most it may hold. */
    readonly nameCount: string
}

/** One verified CV line with its proof link. */
export type ProfileCvLine = {
    readonly itemId: string
    readonly part: string
    readonly line: string
    readonly signed: string
    readonly evidence: string
    readonly code: string
    readonly url: string
    readonly isPublic: boolean
    readonly isCopied: boolean
}

/** The verified CV lines and what still waits. */
export type ProfileCvView = {
    /** The words at the head's end: the verified count against the hiring threshold. */
    readonly gate: string
    readonly lines: ReadonlyArray<ProfileCvLine>
}

/** The combined CV link: where it lives, whether it is public and whether it has anything to show. */
export type ProfileCvLinkView = {
    readonly url: string
    readonly isPublic: boolean
    readonly verifiedCount: number
}

/** One paired device in words. */
export type ProfileDeviceView = {
    readonly id: string
    readonly name: string
    readonly detail: string
    readonly isOnline: boolean
}

/** The plan of the learner in words. */
export type ProfilePlanView = { readonly isPremium: boolean; readonly status: string; readonly note: string }

/** The side of the page: a few figures of progress and the words about experience. */
export type ProfileAsideView = {
    readonly figures: ReadonlyArray<{ readonly id: string; readonly term: string; readonly value: number }>
    readonly experience: string
}

/** The fixed words of the profile (view and edit). */
export type ProfileHubLabels = {
    readonly title: string
    readonly loading: string
    readonly editTitle: string
    readonly editMeta: string
    readonly edit: string
    readonly editNew: string
    readonly cancel: string
    readonly saveChanges: string
    readonly crumbLabel: string
    readonly crumbProfile: string
    readonly crumbEdit: string
    readonly profileHref: string
    readonly editHref: string
    readonly identityTitle: string
    readonly avatarTitle: string
    readonly avatarLabel: string
    readonly upload: string
    readonly uploadAnother: string
    readonly remove: string
    readonly uploading: string
    readonly avatarHint: string
    readonly nameLabel: string
    readonly namePlaceholder: string
    readonly nameHint: string
    readonly issue: string
    readonly goalTitle: string
    readonly goalNone: string
    readonly goalChoose: string
    readonly goalChange: string
    readonly goalHref: string
    readonly cvLinkTitle: string
    readonly cvLinkLabel: string
    readonly cvLinkCopy: string
    readonly cvLinkCopied: string
    readonly cvLinkCopyError: string
    readonly cvLinkSwitch: string
    readonly cvLinkSwitchHint: string
    readonly cvLinkEmpty: string
    readonly cvTitle: string
    readonly cvEmptyTitle: string
    readonly cvEmpty: string
    readonly cvEmptyAction: string
    readonly cvEmptyHref: string
    readonly verified: string
    readonly verifyCopy: string
    readonly verifyCopied: string
    readonly verifyPublic: string
    readonly verifyPrivate: string
    readonly accountTitle: string
    readonly devicesTitle: string
    readonly devicesManage: string
    readonly devicesHref: string
    readonly devicesEmpty: string
    readonly online: string
    readonly offline: string
    readonly planTitle: string
    readonly planManage: string
    readonly planHref: string
    readonly asideProgressTitle: string
    readonly asideProgressLink: string
    readonly progressHref: string
    readonly asideExperienceTitle: string
    readonly asideExperienceLink: string
    readonly experienceHref: string
    readonly savedTitle: string
    readonly savedText: string
    readonly removeTitle: string
    readonly removeText: string
    readonly removeKeep: string
    readonly removeConfirm: string
    readonly unsaved: string
}

/** The slots of the profile page, one per read, so a part that fails or is hidden does not take the others with it. */
export type ProfileHubViews = {
    readonly identity: DataSlot<ProfileIdentityView>
    readonly cvLink: DataSlot<ProfileCvLinkView>
    readonly cv: DataSlot<ProfileCvView>
    readonly devices: DataSlot<ReadonlyArray<ProfileDeviceView>>
    readonly plan: DataSlot<ProfilePlanView>
    readonly aside: DataSlot<ProfileAsideView>
}

/** The fake identity with the geometry of a settled one. */
export const IDENTITY_PLACEHOLDER: ProfileIdentityView = {
    shownName: "xxxxxx",
    nameValue: "xxxxxx",
    email: "xxxxxx",
    avatarUrl: null,
    avatarName: "xxxxxx",
    goalTitle: "xxxxxx",
    canSaveName: false,
    isNew: false,
    nameCount: "0/60",
}

/** The fake CV link with the geometry of a settled one. */
export const CV_LINK_PLACEHOLDER: ProfileCvLinkView = { url: "xxxxxxxxxxxxxxxx", isPublic: false, verifiedCount: 1 }

/** The fake CV with the geometry of a settled one. */
export const CV_PLACEHOLDER: ProfileCvView = {
    gate: "xxxxxx",
    lines: [1, 2].map((index) => ({
        itemId: `placeholder-${index}`,
        part: "xxxxxx",
        line: "xxxxxxxxxxxxxx",
        signed: "xxxxxx",
        evidence: "xxxxxx",
        code: "xxxxxx",
        url: "xxxxxx",
        isPublic: false,
        isCopied: false,
    })),
}

/** The fake devices with the geometry of a settled list. */
export const DEVICES_PLACEHOLDER: ReadonlyArray<ProfileDeviceView> = [1].map((index) => ({
    id: `placeholder-${index}`,
    name: "xxxxxx",
    detail: "xxxxxxxxxx",
    isOnline: false,
}))

/** The fake plan with the geometry of a settled one. */
export const PLAN_PLACEHOLDER: ProfilePlanView = { isPremium: false, status: "xxxxxx", note: "xxxxxxxxxxxx" }

/** The fake aside with the geometry of a settled one. */
export const ASIDE_PLACEHOLDER: ProfileAsideView = {
    figures: [1, 2, 3].map((index) => ({ id: `f${index}`, term: "xxxxxx", value: 0 })),
    experience: "xxxxxxxxxxxxxxxx",
}
