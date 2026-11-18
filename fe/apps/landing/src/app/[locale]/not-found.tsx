import { LandingNotFoundPage, landingNotFoundMetadata } from "@/features/pages/LandingNotFoundPage"
import type { Metadata } from "next"

/** The localized document title of a missing address. */
export const generateMetadata = async (): Promise<Metadata> => landingNotFoundMetadata()

/** The locale segment's not-found slot: it mounts the not-found page and nothing else. */
const NotFound = () => <LandingNotFoundPage />

export default NotFound
