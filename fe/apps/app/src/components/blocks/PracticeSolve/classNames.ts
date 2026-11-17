import { cn } from "@heroui/react"

/** The problem tab: one column on a phone (statement, code and result, hints), two from 1024px. */
export const PROBLEM_GRID_CLASS_NAME: ReturnType<typeof cn> = cn(
    "grid",
    "grid-cols-1",
    "gap-6",
    "lg:grid-cols-2",
    "lg:gap-8",
)

/** The statement: first column, first row on a wide page. */
export const STATEMENT_CLASS_NAME: ReturnType<typeof cn> = cn("min-w-0", "lg:col-start-1", "lg:row-start-1")

/** The editor and the result: second column across both rows on a wide page. */
export const WORK_CLASS_NAME: ReturnType<typeof cn> = cn("min-w-0", "lg:col-start-2", "lg:row-start-1", "lg:row-span-2")

/** The hint ladder: under the statement on a wide page, last on a phone. */
export const HINTS_CLASS_NAME: ReturnType<typeof cn> = cn("min-w-0", "lg:col-start-1", "lg:row-start-2")
