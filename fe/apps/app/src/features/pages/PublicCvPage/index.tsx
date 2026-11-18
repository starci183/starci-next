import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { PublicCv, PublicCvMissing } from "@/components/blocks/PublicCv"
import { navigation } from "@starci-next/i18n/navigation"
import { PUBLIC_CV_IMAGE_ALT, PUBLIC_CV_IMAGE_SIZE } from "./image"
import { readPublicCv } from "@/modules/api/server/publicCv"
import type { ReactElement } from "react"

/** What the route hands the page: the segment of the address. */
type PublicCvPageProps = { readonly slug: string }

/** The slug of an address segment, decoded; an address that does not decode is a link nobody owns. */
const slugOf = (segment: string): string => {
    try {
        return decodeURIComponent(segment)
    } catch {
        return ""
    }
}

/**
 * The document head of a public CV: the name and the signed count as the title and description, the picture a pasted link shows (the
 * `opengraph-image` of the route), and `noindex` until the owner rules on search engines. A missing or private CV gets the generic
 * StarCi head with no name, so the head tells nobody whether a link exists.
 */
export const publicCvMetadata = async (props: PublicCvPageProps): Promise<Metadata> => {
    const t = await getTranslations("app.publicCv")
    const read = await readPublicCv(slugOf(props.slug), await getLocale())
    const robots = { index: false, follow: false }
    if (read.status !== "found") return { title: t("pageTitle"), robots }
    const title = t("metaTitle", { name: read.cv.displayName })
    const description = t("metaDescription", { count: read.cv.lines.length })
    const locale = await getLocale()
    const image = {
        url: navigation.getPathname({ href: `/cv/${props.slug}/opengraph-image`, locale }),
        ...PUBLIC_CV_IMAGE_SIZE,
        alt: PUBLIC_CV_IMAGE_ALT,
    }
    return { title, description, robots, openGraph: { title, description, type: "profile", images: [image] } }
}

/**
 * The public CV page of one learner: a server owner that asks the core whether the link has a CV. A link with none answers HTTP 404 (the
 * not-found slot of the route draws it); a core that does not answer in time leaves the page to read in the browser.
 */
export const PublicCvPage = async (props: PublicCvPageProps): Promise<ReactElement> => {
    const read = await readPublicCv(slugOf(props.slug), await getLocale())
    if (read.status === "notFound") notFound()
    return <PublicCv slug={props.slug} initial={read.status === "found" ? read.cv : undefined} />
}

/** The not-found page of a public CV: the same notice for a wrong link and a private CV. */
export const PublicCvNotFoundPage = (): ReactElement => <PublicCvMissing />
