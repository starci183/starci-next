import { Module, type DynamicModule, type Provider } from "@nestjs/common"
import { PROFILE_AVATAR_STORE } from "./profile-store.port"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./profile.module-definition"
import { ProfileService } from "./profile.service"
import { UnconfiguredAvatarStoreClient } from "./unconfigured-avatar-store.client"

@Module({})
/** The profile capability: the display name, the avatar and the goal a learner shows. */
export class ProfileModule extends ConfigurableModuleClass {
    /** Registers the profile service and binds the object store the app names, or the one that refuses uploads. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const storeClass = options.store ?? UnconfiguredAvatarStoreClient
        const store: Provider = { provide: PROFILE_AVATAR_STORE, useExisting: storeClass }
        return {
            ...base,
            providers: [...(base.providers ?? []), storeClass, store, ProfileService],
            exports: [ProfileService],
        }
    }
}
