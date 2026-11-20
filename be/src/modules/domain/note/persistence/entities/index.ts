import { NoteEntity } from "./note.entity"

export { NoteEntity }

/** The entities of the note capability, named in PRIMARY_ENTITIES of platform/database/entities.ts. */
export const noteEntities: ReadonlyArray<new () => object> = [NoteEntity]
