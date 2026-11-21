import type { useFormatter } from "next-intl"
import { plainLineOf, type ExperienceWords } from "@/hooks/experience"
import type { LearnerProgress, MyCvLink, MyExperienceView, MyPremium, RelayDevices } from "@/hooks/swr"
import { verifyPath } from "@/modules/routes"
import type {
    ProfileAsideView,
    ProfileCvLine,
    ProfileCvLinkView,
    ProfileCvView,
    ProfileDeviceView,
    ProfilePlanView,
} from "@/modules/types"
import { CV_PARTS, partWordsOf, platformWordsOf, type ProfileTranslate } from "@/hooks/profileWords"

type Item = MyExperienceView["items"][number]

/** The verified items that make CV lines: Essentials, Projects, Harness and Luyện code. */
export const cvItemsOf = (data: MyExperienceView | undefined): ReadonlyArray<Item> =>
    (data?.items ?? []).filter((item) => item.state === "verified" && CV_PARTS.has(item.part))

/** The line of an item in the language of the page, as plain text. */
const lineOf = (item: Item, locale: string): string =>
    plainLineOf((item.line ?? item.draftLine)?.[locale === "en" ? "en" : "vi"] ?? item.subject)

/** What the CV lines are drawn from. */
export type CvInput = {
    readonly t: ProfileTranslate
    readonly words: ExperienceWords
    readonly locale: string
    readonly origin: string
    /** The public switches whose last change is still saving or failed, by item. */
    readonly lineStates: Readonly<Record<string, "saving" | "failed">>
    readonly data: MyExperienceView
}

/** Who signed a line, in the words of this page: the teacher, or a reviewer the teacher appointed. */
const signerOf = (t: ProfileTranslate, role: string): string =>
    role === "TEACHER" ? t("cv.signerTeacher") : t("cv.signerReviewer")

/** The CV line of one verified item with who signed it, the proof it rests on and its public link. */
const cvLineOf = (input: CvInput, item: Item): ProfileCvLine => ({
    itemId: item.itemId,
    part: partWordsOf(input.t, item.part),
    line: lineOf(item, input.locale),
    signed:
        item.signature === null
            ? ""
            : input.t("cv.signed", {
                  role: signerOf(input.t, item.signature.role),
                  date: input.words.date(item.signature.signedAt),
              }),
    evidence: item.evidence.map((evidence) => input.words.evidence(evidence.kind)).join(", "),
    code: item.verificationCode,
    url: `${input.origin}${verifyPath(item.verificationCode)}`,
    isPublic: item.shownPublicly,
    lineState: input.lineStates[item.itemId] ?? "idle",
})

/** The verified CV lines of the learner with the gate against the hiring threshold. */
export const cvOf = (input: CvInput): ProfileCvView => {
    const items = cvItemsOf(input.data)
    return {
        gate: input.t("cv.gate", { count: items.length, min: input.data.hiringMinVerified }),
        lines: items.map((item) => cvLineOf(input, item)),
    }
}

/** The combined CV link: the full address, whether it is public and how many verified lines it holds. */
export const cvLinkOf = (origin: string, data: MyCvLink): ProfileCvLinkView => ({
    url: `${origin}${data.path}`,
    isPublic: data.isPublic,
    verifiedCount: data.verifiedCount,
})

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

/** The plan of the learner in words. */
export const planOf = (t: ProfileTranslate, words: ExperienceWords, data: MyPremium): ProfilePlanView => ({
    isPremium: data.isPremium,
    status:
        data.isPremium && data.premiumUntil !== null
            ? t("account.plan.until", { date: words.date(data.premiumUntil) })
            : t("meta.free"),
    note: data.isPremium ? t("account.plan.premiumNote") : t("account.plan.freeScope"),
})

/** The side of the page: three figures from progress and the words about how many items are verified or waiting. */
export const asideOf = (
    t: ProfileTranslate,
    progress: LearnerProgress,
    experience: MyExperienceView | undefined,
): ProfileAsideView => {
    const items = experience?.items ?? []
    const verified = items.filter((item) => item.state === "verified").length
    const pending = items.filter((item) => item.state === "pending-review").length
    const min = experience?.hiringMinVerified ?? 3
    return {
        figures: [
            { id: "proved", term: t("aside.proved"), value: progress.ribbon.provedConcepts },
            ...(progress.practice === null
                ? []
                : [{ id: "accepted", term: t("aside.accepted"), value: progress.practice.acceptedCount }]),
            { id: "streak", term: t("aside.streak"), value: progress.ribbon.streak },
        ],
        experience:
            verified >= min
                ? t("aside.experienceEnough", { verified })
                : t("aside.experience", { verified, pending, min }),
    }
}
