import {
    MAILER,
    MailModule as PackageMailModule,
    type MailOptions as PackageMailOptions,
    type Mailer,
} from "@starci/mail"
import { Module, type DynamicModule } from "@nestjs/common"
import { MAIL_PORT, MAIL_SETTINGS } from "./mail.decorators"
import { toMailError } from "./mail-failure.mapper"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./mail.module-definition"

/** The package's mailer as the app port: every failure leaves as this boundary's error. */
const portOf = (mailer: Mailer): Mailer => ({
    send: (request) =>
        mailer.send(request).catch((cause: unknown) => {
            throw toMailError(cause)
        }),
})

@Module({})
/** Composes `@starci/mail` with the app's typed settings and provides the settings of the app's own mail. */
export class MailModule extends ConfigurableModuleClass {
    /** Registers the capability once per app. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const { brandName, defaultLanguage, isGlobal, ...transport } = options
        const base = super.register(options)
        const mail = PackageMailModule.register({ ...(transport satisfies PackageMailOptions), isGlobal: false })
        return {
            ...base,
            imports: [...(base.imports ?? []), mail],
            providers: [
                ...(base.providers ?? []),
                { provide: MAIL_SETTINGS, useValue: { ...transport, brandName, defaultLanguage } },
                { provide: MAIL_PORT, inject: [MAILER], useFactory: portOf },
            ],
            exports: [...(base.exports ?? []), MAIL_PORT, MAIL_SETTINGS],
            global: isGlobal === true,
        }
    }
}
