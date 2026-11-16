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
export const CV_PARTS: ReadonlySet<string> = new Set(["essentials", "projects", "harness"])

/** The words of the part of a CV line. */
export const partWordsOf = (t: ProfileTranslate, part: string): string => {
    if (part === "projects") return t("cv.part.projects")
    return part === "harness" ? t("cv.part.harness") : t("cv.part.essentials")
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

/** The words of the identity part. */
const identityLabelsOf = (t: ProfileTranslate, issue: string, maxBytes: number) => ({
    identityTitle: t("identity.title"),
    avatarLabel: t("identity.avatarLabel"),
    upload: t("identity.upload"),
    remove: t("identity.remove"),
    avatarHint: t("identity.avatarHint", { size: sizeWordsOf(maxBytes) }),
    nameLabel: t("identity.nameLabel"),
    namePlaceholder: t("identity.namePlaceholder"),
    nameHint: t("identity.nameHint"),
    save: t("identity.save"),
    saved: t("identity.saved"),
    issue,
    goalTitle: t("goal.title"),
    goalNone: t("goal.none"),
    goalChoose: t("goal.choose"),
    goalChange: t("goal.change"),
    goalHref: APP_ROUTES.pathsChoose,
})

/** The words of the CV and verify parts. */
const cvLabelsOf = (t: ProfileTranslate) => ({
    cvTitle: t("cv.title"),
    cvCaption: t("cv.caption"),
    cvSeeAll: t("cv.seeAll"),
    cvSeeAllHref: APP_ROUTES.experience,
    cvEmpty: t("cv.empty"),
    proof: t("cv.proof"),
    verifyTitle: t("verify.title"),
    verifyCaption: t("verify.caption"),
    verifyCopy: t("verify.copy"),
    verifyCopied: t("verify.copied"),
    verifyPublic: t("verify.public"),
    verifyPrivate: t("verify.private"),
    verifyEmpty: t("verify.empty"),
})

/** The words of the account panels. */
const accountLabelsOf = (t: ProfileTranslate) => ({
    devicesTitle: t("account.devices.title"),
    devicesManage: t("account.devices.manage"),
    devicesHref: APP_ROUTES.devices,
    devicesEmpty: t("account.devices.empty"),
    online: t("account.devices.online"),
    offline: t("account.devices.offline"),
    tokensTitle: t("account.tokens.title"),
    tokensManage: t("account.tokens.manage"),
    tokensHref: APP_ROUTES.connect,
    tokensEmpty: t("account.tokens.empty"),
    planTitle: t("account.plan.title"),
    planManage: t("account.plan.manage"),
    planHref: APP_ROUTES.premium,
})

/** The fixed words of the profile, from the catalogue. */
export const labelsOf = (t: ProfileTranslate, issue: string, maxBytes: number): ProfileHubLabels => ({
    title: t("title"),
    description: t("description"),
    ...identityLabelsOf(t, issue, maxBytes),
    ...cvLabelsOf(t),
    ...accountLabelsOf(t),
})
