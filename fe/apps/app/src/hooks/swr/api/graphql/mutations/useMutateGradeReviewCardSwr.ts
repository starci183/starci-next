"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateGradeReviewCard } from "@/modules/api/graphql/mutations/mutation-grade-review-card"
import type { ReviewGrade, ReviewGradeResultView } from "@/modules/types"

/** Cache identity of the GradeReviewCard write. */
export const MUTATE_GRADE_REVIEW_CARD_SWR_KEY = "MUTATE_GRADE_REVIEW_CARD_SWR"

/** The input of one GradeReviewCard write. */
export interface GradeReviewCardArgument {
    readonly itemId: string
    readonly revision: number
    readonly grade: ReviewGrade
    readonly clozeCorrect?: boolean
}

/** The extra argument SWR hands the fetcher. */
interface GradeReviewCardExtra {
    readonly arg: GradeReviewCardArgument
}

/** Stores the self-grade of a revealed item. */
export const useMutateGradeReviewCardSwr = (): SWRMutationResponse<
    ReviewGradeResultView,
    unknown,
    string,
    GradeReviewCardArgument
> =>
    useSWRMutation<ReviewGradeResultView, unknown, string, GradeReviewCardArgument>(
        MUTATE_GRADE_REVIEW_CARD_SWR_KEY,
        async (_key: string, { arg }: GradeReviewCardExtra) => {
            const { data } = await failing(() =>
                mutateGradeReviewCard({ request: { ...arg, clozeCorrect: arg.clozeCorrect ?? null } }),
            )
            if (data === undefined) throw new Error("gradeReviewCard answered no data")
            return data.gradeReviewCard
        },
    )
