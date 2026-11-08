import type { Type } from "@nestjs/common"
import type { ExperienceNotifier } from "./experience-notifier.port"

/** Options of the career capability; every review setting falls back to its proposed default (Q-CA-3..8). */
export interface CareerOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** Working days a signer has from pending review; absent, 3. */
    readonly reviewWorkingDays?: number
    /** Working days after which a pending item is due soon; absent, 2. */
    readonly reminderWorkingDays?: number
    /** Returns after which the next resubmit goes to the teacher only; absent, 3. */
    readonly returnsBeforeTeacher?: number
    /** Calendar days the teacher has for such a resubmit; absent, 7. */
    readonly teacherHoldDays?: number
    /** Open items a reviewer holds at once unless the appointment names another number; absent, 30. */
    readonly reviewerCapacity?: number
    /** Verified items that open the hiring bridge; absent, 3. */
    readonly hiringMinVerified?: number
    /** The notifier of verified and returned items; absent, `SilentNotifierClient`, which sends nothing. */
    readonly notifier?: Type<ExperienceNotifier>
    /** Whether the development seed of experience items may run; absent, false, so production refuses it. */
    readonly devSeed?: boolean
}
