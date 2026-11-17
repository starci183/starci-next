import type { useFormatter } from "next-intl"
import { plainLineOf, type ExperienceWords } from "@/hooks/experience"
import type { MyExperienceView, MyPremium, McpConnection, RelayDevices } from "@/hooks/swr"
import { verifyPath } from "@/modules/routes"
import type {
    ProfileCvLine,
    ProfileCvView,
    ProfileDeviceView,
    ProfilePlanView,
    ProfileTokenView,
    ProfileVerifyLink,
} from "@/modules/types"
import { CV_PARTS, partWordsOf, platformWordsOf, type ProfileTranslate } from "@/hooks/profileWords"

type Item = MyExperienceView["items"][number]

/** The public address of the verification page of one item. */
const verifyUrlOf = (origin: string, path: string): string => `${origin}${path}`

/** The verified items that make CV lines and public links: Essentials, Projects and Harness only. */
export const cvItemsOf = (data: MyExperienceView | undefined): ReadonlyArray<Item> =>
    (data?.items ?? []).filter((item) => item.state === "verified" && CV_PARTS.has(item.part))

/** The line of an item in the language of the page, as plain text. */
const lineOf = (item: Item, locale: string): string =>
    plainLineOf((item.line ?? item.draftLine)?.[locale === "en" ? "en" : "vi"] ?? item.subject)

/** The CV line of one verified item with who signed it, the proof it rests on and the link to it. */
const cvLineOf = (t: ProfileTranslate, words: ExperienceWords, locale: string, item: Item): ProfileCvLine => ({
    itemId: item.itemId,
    part: partWordsOf(t, item.part),
    line: lineOf(item, locale),
    signed:
        item.signature === null
            ? ""
            : t("cv.signed", { role: words.role(item.signature.role), date: words.date(item.signature.signedAt) }),
    evidence: item.evidence.map((evidence) => words.evidence(evidence.kind)).join(", "),
    proofHref: verifyPath(item.verificationCode),
})

/** The note under the CV list: the verified count against the hiring threshold, and what waits for review. */
const cvNoteOf = (t: ProfileTranslate, data: MyExperienceView, verified: number): string => {
    const waiting = data.items.filter((item) => item.state === "pending-review" || item.state === "ai-graded").length
    const gate = t("cv.gate", { count: verified, min: data.hiringMinVerified })
    return waiting === 0 ? gate : `${gate}, ${t("cv.pending", { count: waiting })}`
}

/** The verified CV lines of the learner with the note under them. */
export const cvOf = (
    t: ProfileTranslate,
    words: ExperienceWords,
    locale: string,
    data: MyExperienceView,
): ProfileCvView => {
    const items = cvItemsOf(data)
    return { note: cvNoteOf(t, data, items.length), lines: items.map((item) => cvLineOf(t, words, locale, item)) }
}

/** What the public verify links are drawn from. */
export type VerifyLinksInput = {
    readonly data: MyExperienceView
    readonly locale: string
    readonly origin: string
    readonly copiedId: string | undefined
}

/** The public verify link of every verified CV item. */
export const verifyLinksOf = (input: VerifyLinksInput): ReadonlyArray<ProfileVerifyLink> =>
    cvItemsOf(input.data).map((item) => ({
        itemId: item.itemId,
        title: lineOf(item, input.locale),
        url: verifyUrlOf(input.origin, verifyPath(item.verificationCode)),
        isPublic: item.shownPublicly,
        isCopied: input.copiedId === item.itemId,
    }))

/** The paired devices in words. */
export const devicesOf = (
    t: ProfileTranslate,
    format: ReturnType<typeof useFormatter>,
    list: RelayDevices,
): ReadonlyArray<ProfileDeviceView> =>
    list.map((device) => ({
        id: device.id,
        name: device.name,
        detail:
            device.lastSeenAt === null
                ? platformWordsOf(t, device.platform)
                : t("account.devices.seen", {
                      platform: platformWordsOf(t, device.platform),
                      when: format.relativeTime(new Date(device.lastSeenAt)),
                  }),
        isOnline: device.online,
    }))

/** The MCP tokens in words: the hint of the secret and when it was last used, never the token. */
export const tokensOf = (
    t: ProfileTranslate,
    format: ReturnType<typeof useFormatter>,
    connection: McpConnection,
): ReadonlyArray<ProfileTokenView> =>
    connection.mcpTokens.map((token) => ({
        id: token.id,
        name: token.name,
        detail: `${t("account.tokens.hint", { hint: token.hint })}, ${
            token.lastUsedAt === null
                ? t("account.tokens.neverUsed")
                : t("account.tokens.used", { when: format.relativeTime(new Date(token.lastUsedAt)) })
        }`,
    }))

/** The plan of the learner in words. */
export const planOf = (t: ProfileTranslate, words: ExperienceWords, data: MyPremium): ProfilePlanView => ({
    isPremium: data.isPremium,
    status:
        data.isPremium && data.premiumUntil !== null
            ? t("account.plan.until", { date: words.date(data.premiumUntil) })
            : t("account.plan.free"),
    note: data.isPremium ? t("account.plan.premiumNote") : t("account.plan.freeNote"),
})
