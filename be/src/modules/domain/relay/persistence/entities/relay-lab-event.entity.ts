import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("relay_lab_events")
/** The client event id of one lab upload a device sent, so a resend changes nothing twice. */
export class RelayLabEventEntity {
    /** The device that uploaded it. */
    @Column({ name: "device_id", type: "uuid" })
    deviceId!: string

    /** The client event id the CLI chose. */
    @Column({ name: "event_id", type: "uuid" })
    eventId!: string

    /** When the relay stored it. */
    @Column({ name: "created_at", type: "timestamptz" })
    createdAt!: Date

    /** The surrogate key; the former key is the unique `<table>_natural_key`. */
    @PrimaryGeneratedColumn("uuid", { name: "id" })
    id!: string
}
