import { notFound } from "next/navigation"

/** The catch-all slot: an address under a locale that no route matches is a missing page, drawn by the locale's own not-found. */
const Page = (): never => notFound()

export default Page
