import type { useTranslations } from "next-intl"
import { APP_ROUTES } from "@/modules/routes"
import type { ProfileHubLabels } from "@/modules/types"

/** What went wrong with the last avatar or name change, in the words of the catalog. */
export type ProfileIssue = "none" | "type" | "size" | "failed" | "unavailable" | "name" | "other"

/** A size in bytes as megabytes or kilobytes, rounded up so the words never promise more than the limit. */
export const sizeWordsOf = (bytes: number): string =>
    bytes >= 1024 * 1024 ? `${Math.ceil(bytes / (1024 * 1024))} MB` : `${Math.ceil(bytes / 1024)} KB`

/** The translator of the `app.profile` catalog. */
export type ProfileTranslate = ReturnType<typeof useTranslations>

/** The parts whose verified items make a CV line of the profile. */
export const CV_PARTS: ReadonlySet<string> = new Set(["essentials", "projects", "harness", "practice"])

/** The words of the part of a CV line. */
export const partWordsOf = (t: ProfileTranslate, part: string): string => {
    if (part === "projects") return t("cv.partProjects")
    if (part === "harness") return t("cv.part.harness")
    return part === "practice" ? t("cv.part.practice") : t("cv.part.essentials")
}

/** The platform of a device in the reader words. */
export const platformWordsOf = (t: ProfileTranslate, platform: string): string => {
    if (platform === "windows") return t("account.devices.platform.windows")
    return platform === "macos" ? t("account.devices.platform.macos") : t("account.devices.platform.linux")
}

/** What the words of an issue are drawn from. */
export type IssueLimits = { readonly maxBytes: number; readonly nameMax: number }

/** The words of the issue of the last change, empty when there is none. */
export const profileIssueWordsOf = (t: ProfileTranslate, issue: ProfileIssue, limits: IssueLimits): string => {
    const words: Record<ProfileIssue, string> = {
        none: "",
        type: t("identity.error.type"),
        size: t("identity.error.size", { size: sizeWordsOf(limits.maxBytes) }),
        failed: t("identity.error.failed"),
        unavailable: t("identity.error.unavailable"),
        name: t("identity.error.name", { max: limits.nameMax }),
        other: t("identity.error.other"),
    }
    return words[issue]
}

/** The fixed words of the profile (view and edit), from the catalogue. */
export const labelsOf = (t: ProfileTranslate, issue: string, maxBytes: number): ProfileHubLabels => ({
    title: t("title"),
    loading: t("loading"),
    editTitle: t("edit.title"),
    editMeta: t("edit.meta"),
    edit: t("edit.open"),
    editNew: t("edit.openNew"),
    cancel: t("edit.cancel"),
    saveChanges: t("edit.save"),
    crumbLabel: t("crumb.label"),
    crumbProfile: t("pageTitle"),
    crumbEdit: t("crumb.edit"),
    profileHref: APP_ROUTES.profile,
    editHref: APP_ROUTES.profileEdit,
    identityTitle: t("identity.title"),
    avatarTitle: t("identity.avatarTitle"),
    avatarLabel: t("identity.avatarLabel"),
    upload: t("identity.upload"),
    uploadAnother: t("identity.uploadAnother"),
    remove: t("identity.remove"),
    uploading: t("identity.uploading"),
    avatarHint: t("identity.avatarHint", { size: sizeWordsOf(maxBytes) }),
    nameLabel: t("identity.nameLabel"),
    namePlaceholder: t("identity.namePlaceholder"),
    nameHint: t("identity.nameOnCvHint"),
    issue,
    goalTitle: t("goal.title"),
    goalNone: t("goal.none"),
    goalChoose: t("goal.choose"),
    goalChange: t("goal.change"),
    goalHref: APP_ROUTES.pathsChoose,
    cvLinkTitle: t("cvLink.title"),
    cvLinkLabel: t("cvLink.label"),
    cvLinkCopy: t("cvLink.copy"),
    cvLinkCopied: t("cvLink.copied"),
    cvLinkCopyError: t("cvLink.copyError"),
    cvLinkSwitch: t("cvLink.switch"),
    cvLinkSwitchHint: t("cvLink.switchHint"),
    cvLinkEmpty: t("cvLink.empty"),
    cvTitle: t("cv.title"),
    cvEmptyTitle: t("cv.emptyTitle"),
    cvEmpty: t("cv.emptyWays"),
    cvEmptyAction: t("cv.emptyAction"),
    cvEmptyHref: APP_ROUTES.experience,
    verified: t("cv.verified"),
    verifyLinkLabel: t("cv.verifyLinkLabel"),
    lineShown: t("cv.lineShown"),
    lineShownHint: t("cv.lineShownHint"),
    lineSaving: t("cv.lineSaving"),
    lineFailed: t("cv.lineFailed"),
    accountTitle: t("account.title"),
    devicesTitle: t("account.devices.title"),
    devicesManage: t("account.devices.manage"),
    devicesHref: APP_ROUTES.devices,
    devicesEmpty: t("account.devices.empty"),
    online: t("account.devices.online"),
    offline: t("account.devices.offline"),
    planTitle: t("account.plan.title"),
    planManage: t("account.plan.manage"),
    planHref: APP_ROUTES.premium,
    asideProgressTitle: t("aside.progressTitle"),
    asideProgressLink: t("aside.progressLink"),
    progressHref: APP_ROUTES.progress,
    asideExperienceTitle: t("aside.experienceTitle"),
    asideExperienceLink: t("aside.experienceLink"),
    experienceHref: APP_ROUTES.experience,
    savedTitle: t("saved.title"),
    savedText: t("saved.text"),
    removeTitle: t("remove.title"),
    removeText: t("remove.text"),
    removeKeep: t("remove.keep"),
    removeConfirm: t("remove.confirm"),
    unsaved: t("edit.unsaved"),
})
