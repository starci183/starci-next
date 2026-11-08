import { Module } from "@nestjs/common"
import { GetRelayManifestHandler } from "./application/get-relay-manifest.handler"
import { UploadRelayEventHandler } from "./application/upload-relay-event.handler"
import { ConfigurableModuleClass } from "./relay-feed.module-definition"

@Module({ providers: [GetRelayManifestHandler, UploadRelayEventHandler] })
/** Application handlers of the relay feed: the signed manifest read and the device uploads. */
export class RelayFeedApiModule extends ConfigurableModuleClass {}
