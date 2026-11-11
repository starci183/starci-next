import type { INestApplication } from "@nestjs/common"
import { IoAdapter } from "@nestjs/platform-socket.io"

/** Serves the app's socket gateways with socket.io on the app's own HTTP server, answering the adapter it installed. */
export const applyRealtime = (app: INestApplication): IoAdapter => {
    const adapter = new IoAdapter(app)
    app.useWebSocketAdapter(adapter)
    return adapter
}
