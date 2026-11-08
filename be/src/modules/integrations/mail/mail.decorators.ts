import type { Mailer } from "@starci/mail"
import { injector, type TypedParameterDecorator } from "@modules/platform/composition"
import type { MailOptions } from "./mail.options"

/** Token of the app's mail settings (the brand, the default language, the link lifetimes). */
export const MAIL_SETTINGS: unique symbol = Symbol("integrations.mail.settings")

/** Token of the mail port the app injects; the adapter over `@starci/mail` provides it. */
export const MAIL_PORT: unique symbol = Symbol("integrations.mail.port")

/** Injects the mail port, whose failures leave as this boundary's `MailError`. Parameter type: Mailer. */
export const InjectMailer = (): TypedParameterDecorator<Mailer> => injector<Mailer>(MAIL_PORT)

/** Injects the app's mail settings. Parameter type: MailOptions. */
export const InjectMailSettings = (): TypedParameterDecorator<MailOptions> => injector<MailOptions>(MAIL_SETTINGS)
