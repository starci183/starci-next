/** The request of the gradeReviewCard door. */
export interface GradeReviewCardRequest {
    /** The itemId. */
    readonly itemId: string
    /** The revision. */
    readonly revision: number
    /** The grade. */
    readonly grade: string
    /** The clozeCorrect. */
    readonly clozeCorrect?: boolean | null | undefined
}
