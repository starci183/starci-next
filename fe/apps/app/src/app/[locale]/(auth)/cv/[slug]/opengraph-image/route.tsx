import { ImageResponse } from "next/og"
import { PUBLIC_CV_IMAGE_SIZE, publicCvImageOf } from "@/features/pages/PublicCvPage/image"
import en from "@/modules/i18n/messages/en.json"
import vi from "@/modules/i18n/messages/vi.json"

/** The route's framework inputs: the locale and the slug of the address. */
type RouteContext = { readonly params: Promise<{ readonly locale: string; readonly slug: string }> }

/** The catalogs the preview reads straight from, since an image route has no request scope to translate in. */
const CATALOGS = { vi, en } as const

/** The part labels the catalogs word, by source. */
type PartKey = keyof typeof vi.app.experience.part

/**
 * The preview a pasted CV link shows (1200 by 630): the owner and the signed lines when the CV is public, the generic StarCi card
 * when it is not. A plain route rather than the `opengraph-image` file convention, so its address is the same on every deploy and the
 * share sheet can show it.
 */
export const GET = async (_request: Request, context: RouteContext): Promise<ImageResponse> => {
    const { locale, slug } = await context.params
    const app = CATALOGS[locale === "en" ? "en" : "vi"].app
    const t = app.publicCv
    return new ImageResponse(
        await publicCvImageOf({
            slug,
            locale,
            words: {
                brand: t.imageBrand,
                badge: t.imageBadge,
                generic: t.imageGeneric,
                trail: t.imageTrail,
                count: (count: number) => t.imageCount.replace("{count}", String(count)),
                more: (count: number) => t.imageMore.replace("{count}", String(count)),
                part: (part: string) => app.experience.part[part as PartKey] ?? part,
            },
        }),
        PUBLIC_CV_IMAGE_SIZE,
    )
}
