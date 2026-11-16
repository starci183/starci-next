import type {
    ProfileCvView,
    ProfileDeviceView,
    ProfileIdentityView,
    ProfilePlanView,
    ProfileTokenView,
    ProfileVerifyLink,
} from "@/modules/types"

/** The fake identity with the geometry of a settled one. */
export const IDENTITY_PLACEHOLDER: ProfileIdentityView = {
    shownName: "xxxxxx",
    nameValue: "xxxxxx",
    avatarUrl: null,
    goalTitle: "xxxxxx",
    canSaveName: false,
}

/** The fake CV with the geometry of a settled one. */
export const CV_PLACEHOLDER: ProfileCvView = {
    note: "xxxxxx",
    lines: [1, 2].map((index) => ({
        itemId: `placeholder-${index}`,
        part: "xxxxxx",
        line: "xxxxxxxxxxxxxx",
        signed: "xxxxxx",
        evidence: "xxxxxx",
        proofHref: "/",
    })),
}

/** The fake devices with the geometry of a settled list. */
export const DEVICES_PLACEHOLDER: ReadonlyArray<ProfileDeviceView> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: "xxxxxx",
    detail: "xxxxxxxxxx",
    isOnline: false,
}))

/** The fake tokens with the geometry of a settled list. */
export const TOKENS_PLACEHOLDER: ReadonlyArray<ProfileTokenView> = [1, 2].map((index) => ({
    id: `placeholder-${index}`,
    name: "xxxxxx",
    detail: "xxxxxxxxxx",
}))

/** The fake plan with the geometry of a settled one. */
export const PLAN_PLACEHOLDER: ProfilePlanView = { isPremium: false, status: "xxxxxx", note: "xxxxxxxxxxxx" }

/** The fake verify links with the geometry of a settled list. */
export const VERIFY_PLACEHOLDER: ReadonlyArray<ProfileVerifyLink> = [1, 2].map((index) => ({
    itemId: `placeholder-${index}`,
    title: "xxxxxxxxxxxx",
    url: "xxxxxxxxxxxxxxxx",
    isPublic: false,
    isCopied: false,
}))
