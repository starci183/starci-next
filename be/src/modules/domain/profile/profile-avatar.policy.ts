import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import type { OptionalDisplayName } from "./profile.contracts"
import type { ProfileOptions } from "./profile.options"

/** The image types an avatar may be and the file extension each key carries. */
export const AVATAR_EXTENSIONS: Readonly<Record<string, string>> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
}

/** The settings the profile reads, each with its default. */
export interface ProfileSettings {
    /** The largest avatar in bytes. */
    readonly avatarMaxBytes: number
    /** The content types admitted. */
    readonly avatarContentTypes: ReadonlyArray<string>
    /** The longest display name. */
    readonly nameMax: number
    /** How long a signed upload works, in seconds. */
    readonly uploadTtlSeconds: number
}

/** 2 MiB. */
const AVATAR_MAX_BYTES_DEFAULT = 2 * 1024 * 1024
const NAME_MAX_DEFAULT = 60
const UPLOAD_TTL_DEFAULT = 300
const KEY_TAIL = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp)$/u
/** The highest code point of the C0 control block; the delete character follows it. */
const CONTROL_MAX = 0x1f
const DELETE = 0x7f

const hasControl = (text: string): boolean =>
    [...text].some((character) => (character.codePointAt(0) ?? 0) <= CONTROL_MAX || character.codePointAt(0) === DELETE)

/** Reads the settings from the options, each with its default; a type outside the three images is dropped. */
export const profileSettingsOf = (options: ProfileOptions): ProfileSettings => ({
    avatarMaxBytes: options.avatarMaxBytes ?? AVATAR_MAX_BYTES_DEFAULT,
    avatarContentTypes: (options.avatarContentTypes ?? Object.keys(AVATAR_EXTENSIONS)).filter(
        (type) => AVATAR_EXTENSIONS[type] !== undefined,
    ),
    nameMax: options.nameMax ?? NAME_MAX_DEFAULT,
    uploadTtlSeconds: options.uploadTtlSeconds ?? UPLOAD_TTL_DEFAULT,
})

/** The content type without parameters, in lower case. */
export const contentTypeOf = (raw: string): string => (raw.split(";")[0] ?? "").trim().toLowerCase()

/** Refuses a content type or size the profile does not admit. */
export const assertAvatar = (settings: ProfileSettings, contentType: string, size: number): void => {
    if (!settings.avatarContentTypes.includes(contentTypeOf(contentType))) {
        throw new ProfileError({ code: ProfileErrorCode.AvatarTypeNotAllowed })
    }
    if (!Number.isInteger(size) || size <= 0 || size > settings.avatarMaxBytes) {
        throw new ProfileError({ code: ProfileErrorCode.AvatarTooLarge, params: { maxBytes: settings.avatarMaxBytes } })
    }
}

/** The storage key of one avatar of a learner: `avatars/<learner>/<nonce>.<ext>`; a new upload is a new key, so a stale address never shows a new image. */
export const avatarKeyOf = (learnerId: string, contentType: string, nonce: string): string =>
    `avatars/${learnerId}/${nonce}.${AVATAR_EXTENSIONS[contentTypeOf(contentType)] ?? "bin"}`

/** Whether a key is one the learner owns: under their own folder, with a generated name. */
export const ownsAvatarKey = (learnerId: string, key: string): boolean => {
    const prefix = `avatars/${learnerId}/`
    return key.startsWith(prefix) && KEY_TAIL.test(key.slice(prefix.length))
}

/** The display name to store: trimmed, null for an empty one (the learner clears it), and refused when too long or holding a control character. */
export const displayNameOf = (settings: ProfileSettings, raw: OptionalDisplayName): OptionalDisplayName => {
    const name = (raw ?? "").trim()
    if (name === "") return null
    if ([...name].length > settings.nameMax || hasControl(name)) {
        throw new ProfileError({ code: ProfileErrorCode.NameInvalid, params: { max: settings.nameMax } })
    }
    return name
}
