"use client"

import type { AppointReviewerCardProps, AppointReviewerValue, AssignItemCardProps } from "@starci-next/ui"
import { useTranslations } from "next-intl"
import { useState } from "react"
import {
    useMutateAssignExperienceSwr,
    useMutateSetExperienceReviewerSwr,
    useQueryExperienceReviewersSwr,
    type ExperienceReviewersView,
} from "@/hooks/swr"
import { useReviewerAdminLabels } from "./useReviewerAdminLabels"
import { useReviewerWrite } from "./useReviewerWrite"
import { useExperienceWords } from "./useExperienceWords"

/** The choice of the reassign form that sends the item back to the teacher's queue. */
const TEACHER_QUEUE = "teacher"

/** The parts a reviewer may be appointed to. */
const PARTS: ReadonlyArray<string> = ["essentials", "projects", "incidents", "practice", "interview"]

/** The capacity the form proposes, the proposed default of Q-CA-3. */
const DEFAULT_CAPACITY = 30

/** The teacher's reviewer appointments and reassignment: the reviewers read and the two forms, words included. */
export interface ReviewerAdmin {
    readonly reviewers: ExperienceReviewersView | undefined
    readonly appointCard: AppointReviewerCardProps
    readonly assignCard: AssignItemCardProps
    readonly end: (reviewerId: string) => void
}

/**
 * Runs the Reviewers tab and the reassign form for the teacher: appoints or rescopes a reviewer, ends an appointment, and
 * reassigns the item `itemId` names, then reloads the reads. Idle for anyone but the teacher; the doors check the role again.
 */
export const useReviewerAdmin = (
    isTeacher: boolean,
    itemId: string | undefined,
    reload: () => Promise<unknown>,
): ReviewerAdmin => {
    const t = useTranslations("app.experience.queue")
    const words = useExperienceWords()
    const reviewers = useQueryExperienceReviewersSwr(isTeacher)
    const setReviewer = useMutateSetExperienceReviewerSwr()
    const assignWrite = useMutateAssignExperienceSwr()
    const [form, setForm] = useState<AppointReviewerValue>({ reviewerId: "", parts: [], capacity: DEFAULT_CAPACITY })
    const [assignTo, setAssignTo] = useState(TEACHER_QUEUE)
    const write = useReviewerWrite(() => Promise.all([reviewers.mutate(), reload()]))
    const labels = useReviewerAdminLabels()
    const appointCard: AppointReviewerCardProps = {
        labels: labels.appoint,
        parts: PARTS.map((part) => ({ id: part, label: words.part(part) })),
        value: form,
        isWorking: write.isWorking,
        outcome: write.outcome,
        on: {
            changeReviewer: (reviewerId) => setForm((value) => ({ ...value, reviewerId: reviewerId.trim() })),
            changeParts: (parts) => setForm((value) => ({ ...value, parts })),
            changeCapacity: (capacity) => setForm((value) => ({ ...value, capacity })),
            submit: () =>
                void write.run(
                    () =>
                        setReviewer.trigger({
                            reviewerId: form.reviewerId,
                            parts: [...form.parts],
                            capacity: form.capacity,
                            conflicts: [],
                            end: false,
                        }),
                    labels.appointed,
                ),
        },
    }
    const assignCard: AssignItemCardProps = {
        labels: labels.assign,
        choices: [
            { id: TEACHER_QUEUE, label: t("teacherQueue") },
            ...(reviewers.data ?? []).map((row) => ({
                id: row.reviewerId,
                label: t("reviewerTitle", { handle: row.reviewerId.slice(-6).toUpperCase() }),
            })),
        ],
        selected: assignTo,
        isLoading: reviewers.isLoading,
        isWorking: write.isWorking,
        on: {
            select: setAssignTo,
            submit: () => {
                if (itemId === undefined) return
                const reviewerId = assignTo === TEACHER_QUEUE ? null : assignTo
                void write.run(() => assignWrite.trigger({ itemId, reviewerId }), labels.assigned)
            },
        },
    }
    return {
        reviewers: reviewers.data,
        appointCard,
        assignCard,
        end: (reviewerId) =>
            void write.run(
                () => setReviewer.trigger({ reviewerId, parts: [], capacity: null, conflicts: [], end: true }),
                labels.ended,
            ),
    }
}
