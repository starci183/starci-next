import { defineConfigurableModule } from "@starci/nest-kit"
import type { CiReportCliOptions } from "./ci-report.options"

/** The configurable-module base of the ci-report command. */
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE } =
    defineConfigurableModule<CiReportCliOptions>()
