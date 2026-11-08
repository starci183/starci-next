import { Module, type DynamicModule } from "@nestjs/common"
import { contentDisk } from "./content-disk.client"
import { CONTENT_DISK } from "./content-disk.port"
import { contentGitOf } from "./content-git.client"
import { CONTENT_GIT } from "./content-git.port"
import { ContentSyncService } from "./content-sync.service"
import { CONTENT_OPTIONS } from "./content.decorators"
import type { ContentOptions } from "./content.options"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./content.module-definition"

@Module({})
/** The content capability: the git mount of the content repositories and the sync that runs each importer at the pulled version. */
export class ContentModule extends ConfigurableModuleClass {
    /** Registers the sync with the git and disk ports. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                ContentSyncService,
                {
                    provide: CONTENT_GIT,
                    useFactory: (options: ContentOptions) => contentGitOf(options.environment),
                    inject: [CONTENT_OPTIONS],
                },
                { provide: CONTENT_DISK, useValue: contentDisk },
            ],
            exports: [ContentSyncService],
        }
    }
}
