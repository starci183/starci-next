import { Module } from "@nestjs/common"
import { AiRouterModule } from "@starci/ai-router"
import type { DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./ai-pool.module-definition"
import { LESSON_AI } from "./ai-pool.decorators"
import { LessonAiService } from "./lesson-ai.service"

@Module({})
/** Shared lesson AI pool; consumers receive only the guarded lesson port, never the raw router. */
export class AiPoolModule extends ConfigurableModuleClass {
    /** Registers the pool once per app from options parsed at the app root (`parseAiPoolConfig`). */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            imports: [...(base.imports ?? []), AiRouterModule.register({ isGlobal: false, ...options.pool })],
            providers: [
                ...(base.providers ?? []),
                LessonAiService,
                { provide: LESSON_AI, useExisting: LessonAiService },
            ],
            exports: [LESSON_AI],
        }
    }
}
