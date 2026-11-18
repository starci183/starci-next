import { AppNotFoundPage, appNotFoundMetadata } from "@/features/pages/AppNotFoundPage"
import type { Metadata } from "next"

/** The localized document title of a missing address. */
export const generateMetadata = async (): Promise<Metadata> => appNotFoundMetadata()

/** The locale segment's not-found slot: it mounts the not-found page and nothing else. */
const NotFound = () => <AppNotFoundPage />

export default NotFound
