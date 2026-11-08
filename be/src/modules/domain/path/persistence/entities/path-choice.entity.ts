import { Column, Entity, PrimaryColumn } from "typeorm"
import type { PathHistoryRow } from "../path.rows"

@Entity("path_choices")
/** The outcome path one learner follows now, and the paths they followed before. */
export class PathChoiceEntity {
    /** The learner. */
    @PrimaryColumn({ name: "learner_id", type: "uuid" })
    learnerId!: string

    /** The path followed now. */
    @Column({ name: "active_path_id", type: "text" })
    activePathId!: string

    /** When the path followed now was chosen. */
    @Column({ name: "chosen_at", type: "timestamptz" })
    chosenAt!: Date

    /** Every choice the learner made, oldest first. */
    @Column({ name: "history", type: "jsonb" })
    history!: Array<PathHistoryRow>
}
