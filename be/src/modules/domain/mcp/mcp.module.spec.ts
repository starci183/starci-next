import { Global, Module } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import { AttemptOpenerService } from "@modules/domain/attempt"
import { LessonReadService, LessonSourceService } from "@modules/domain/lesson"
import { RelayDeviceService, RelayFeedService } from "@modules/domain/relay"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { McpModule } from "./mcp.module"
import { McpServerFactory } from "./mcp-server.factory"
import { McpTokenService } from "./mcp-token.service"
import { McpTutorService } from "./mcp-tutor.service"

@Global()
@Module({
    providers: [
        { provide: LessonReadService, useValue: {} },
        { provide: LessonSourceService, useValue: {} },
        { provide: AttemptOpenerService, useValue: {} },
        { provide: RelayDeviceService, useValue: {} },
        { provide: RelayFeedService, useValue: {} },
        { provide: CLOCK, useValue: new FakeClock("2026-11-17T00:00:00.000Z") },
        { provide: PRIMARY_ENTITY_MANAGER, useValue: mockEntityManager() },
    ],
    exports: [
        LessonReadService,
        LessonSourceService,
        AttemptOpenerService,
        RelayDeviceService,
        RelayFeedService,
        CLOCK,
        PRIMARY_ENTITY_MANAGER,
    ],
})
class NeighboursModule {}

describe("McpModule", () => {
    it("composes with the lesson, relay, clock and database the core app provides, and exports what the transports use", async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [
                NeighboursModule,
                McpModule.register({
                    isGlobal: true,
                    tokenLimit: 5,
                    publicUrl: null,
                    embed: null,
                    harnessDir: null,
                    qdrant: null,
                }),
            ],
        }).compile()

        expect(moduleRef.get(McpTokenService)).toBeInstanceOf(McpTokenService)
        expect(moduleRef.get(McpTutorService).connectInfo()).toEqual({ endpoint: "/mcp", tokenLimit: 5 })
        expect(moduleRef.get(McpServerFactory).create("11111111-1111-4111-8111-111111111111")).toBeDefined()
    })
})
