import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { PathService } from "@modules/domain/path"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectIds, type Ids } from "@modules/platform/ids"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ProfileError, ProfileErrorCode } from "./errors/profile.error"
import {
    assertAvatar,
    avatarKeyOf,
    contentTypeOf,
    displayNameOf,
    ownsAvatarKey,
    profileSettingsOf,
    type ProfileSettings,
} from "./profile-avatar.policy"
import { InjectAvatarStore, type AvatarStorePort } from "./profile-store.port"
import type {
    AvatarConfirmParams,
    AvatarReadUrl,
    AvatarLimitsView,
    AvatarUploadParams,
    AvatarUploadView,
    OptionalDisplayName,
    ProfileLocale,
    ProfileView,
} from "./profile.contracts"
import { ProfileLogEvent } from "./profile.log-events"
import { InjectProfileOptions } from "./profile.decorators"
import type { ProfileOptions } from "./profile.options"
import type { ProfileRow } from "./persistence/profile.rows"
import { CLEAR_AVATAR, SELECT_PROFILE, UPSERT_AVATAR, UPSERT_NAME } from "./persistence/profile.sql"

@Injectable()
/**
 * The profile of a learner: the name they chose, the avatar they uploaded and the goal path they follow. The avatar goes from the
 * browser straight to the object store through a signed upload that fixes its type and size; the profile keeps only the storage key
 * (`avatars/<learner>/<id>.<ext>`), never the bytes, and a new upload is a new key so an old address never shows a new image.
 */
export class ProfileService {
    private readonly settings: ProfileSettings

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectIds() private readonly ids: Ids,
        @InjectLogger() private readonly logger: Logger,
        @InjectAvatarStore() private readonly store: AvatarStorePort,
        @InjectProfileOptions() options: ProfileOptions,
        private readonly paths: PathService,
    ) {
        this.settings = profileSettingsOf(options)
    }

    /** The profile of a learner; a learner with no row yet has no name and no avatar. */
    async read(learnerId: string, locale: ProfileLocale): Promise<ProfileView> {
        const [row, active] = await Promise.all([this.rowOf(learnerId), this.paths.active(learnerId, locale)])
        const key = row?.avatar_key ?? null
        return {
            displayName: row?.display_name ?? null,
            avatarUrl: key === null ? null : await this.avatarUrlOf(key),
            avatarUpdatedAt: row?.avatar_updated_at ?? null,
            goal: active === null ? null : { pathId: active.pathId, title: active.title },
            limits: this.limits(),
        }
    }

    /** Sets the display name, or clears it with an empty one; an invalid one is PROFILE_NAME_INVALID. */
    async setDisplayName(learnerId: string, raw: OptionalDisplayName, locale: ProfileLocale): Promise<ProfileView> {
        const name = displayNameOf(this.settings, raw)
        await this.entityManager.query(UPSERT_NAME, [learnerId, name, this.clock.now()])
        return this.read(learnerId, locale)
    }

    /** Signs an upload of one avatar after the type and size passed the limits; nothing is stored until it is confirmed. */
    async requestAvatarUpload(params: AvatarUploadParams): Promise<AvatarUploadView> {
        assertAvatar(this.settings, params.contentType, params.size)
        const contentType = contentTypeOf(params.contentType)
        const key = avatarKeyOf(params.learnerId, contentType, this.ids.next())
        const signed = await this.store.presignUpload(key, {
            contentType,
            contentLength: params.size,
            expiresIn: this.settings.uploadTtlSeconds,
        })
        return {
            key,
            method: "PUT",
            url: signed.url,
            headers: Object.entries(signed.headers).map(([name, value]) => ({ name, value })),
            expiresAt: signed.expiresAt,
            limits: this.limits(),
        }
    }

    /**
     * Keeps an uploaded avatar: the key must be the learner's own, the store must hold it in the asked type and size, and the limits
     * are checked again on what the store recorded. The learner's previous avatar is deleted once the new one is stored.
     */
    async confirmAvatar(params: AvatarConfirmParams): Promise<ProfileView> {
        if (!ownsAvatarKey(params.learnerId, params.key)) {
            throw new ProfileError({ code: ProfileErrorCode.AvatarKeyInvalid })
        }
        assertAvatar(this.settings, params.contentType, params.size)
        const stored = await this.store.head(params.key)
        if (stored?.size !== params.size || contentTypeOf(stored.contentType) !== contentTypeOf(params.contentType)) {
            if (stored !== null) await this.discard(params.key)
            throw new ProfileError({ code: ProfileErrorCode.AvatarNotUploaded })
        }
        assertAvatar(this.settings, stored.contentType, stored.size)
        const previous = (await this.rowOf(params.learnerId))?.avatar_key ?? null
        await this.entityManager.query(UPSERT_AVATAR, [
            params.learnerId,
            params.key,
            contentTypeOf(stored.contentType),
            stored.size,
            this.clock.now(),
        ])
        if (previous !== null && previous !== params.key) await this.discard(previous)
        return this.read(params.learnerId, params.locale)
    }

    /** Removes the avatar of a learner and deletes its object. */
    async removeAvatar(learnerId: string, locale: ProfileLocale): Promise<ProfileView> {
        const previous = (await this.rowOf(learnerId))?.avatar_key ?? null
        await this.entityManager.query(CLEAR_AVATAR, [learnerId, this.clock.now()])
        if (previous !== null) await this.discard(previous)
        return this.read(learnerId, locale)
    }

    private limits(): AvatarLimitsView {
        return {
            maxBytes: this.settings.avatarMaxBytes,
            contentTypes: [...this.settings.avatarContentTypes],
            nameMax: this.settings.nameMax,
        }
    }

    private async rowOf(learnerId: string): Promise<ProfileRow | null> {
        const rows: Array<ProfileRow> = await this.entityManager.query(SELECT_PROFILE, [learnerId])
        return rows[0] ?? null
    }

    /** A signed read of the avatar; a store that cannot answer shows no avatar and is logged, the profile still answers. */
    async avatarUrlOf(key: string): Promise<AvatarReadUrl> {
        try {
            return await this.store.presignRead(key)
        } catch (cause) {
            this.logger.error(ProfileLogEvent.AvatarReadFailed, cause, { key })
            return null
        }
    }

    /** Deletes an object that is no longer wanted; a failure is logged and never fails the learner, the object stays orphaned. */
    private async discard(key: string): Promise<void> {
        try {
            await this.store.remove(key)
        } catch (cause) {
            this.logger.error(ProfileLogEvent.AvatarRemoveFailed, cause, { key })
        }
    }
}
