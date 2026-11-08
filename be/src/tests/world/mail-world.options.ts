import type { ModuleFactory } from "@starci/test-world"
import { MailModule } from "@modules/integrations/mail"

/** The modules of the mail world: the mail integration pointed at the real mail sink of the run, with short deadlines so an outage ends fast. */
export const mailModules: ReadonlyArray<ModuleFactory> = [
    (w) =>
        MailModule.register({
            isGlobal: true,
            host: w.mail.host,
            port: w.mail.port,
            security: "none",
            from: { name: "StarCi", address: "no-reply@starci.test" },
            brandName: "StarCi",
            defaultLanguage: "en",
            connectionTimeoutMs: 1000,
            greetingTimeoutMs: 1000,
            socketTimeoutMs: 1000,
            sendTimeoutMs: 2000,
        }),
]
