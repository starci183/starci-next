import { cn } from "@heroui/react"

/** The one centred column of the result: a measure of about 28rem in the middle of the page body. */
export const RESULT_COLUMN_CLASS_NAME: ReturnType<typeof cn> = cn("mx-auto", "w-full", "max-w-md", "py-12")

/** The row that centres the one onward destination under the order facts. */
export const RESULT_ACTIONS_CLASS_NAME: ReturnType<typeof cn> = cn("flex", "justify-center", "gap-3")

/** The waiting notice: the spinner, the title and the sentence, all centred in one column. */
export const RESULT_PENDING_CLASS_NAME: ReturnType<typeof cn> = cn(
    "flex",
    "flex-col",
    "items-center",
    "gap-3",
    "text-center",
)
