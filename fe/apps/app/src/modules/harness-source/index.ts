import type { HarnessBuildView, HarnessCatalogView, HarnessDocView, HarnessGuideView } from "@/modules/types"
import { buildOf, buildRowsOf } from "./builds"
import { doctorsOf, trialRowsOf } from "./checks"
import { docOf, docRowsOf } from "./docs"
import { guideOf, guideRowsOf } from "./guides"
import { harnessLocaleOf } from "./words"

/**
 * The harness content as typed fixtures, shaped like the harness API of the shared contract (build, stage, e2e result, guide,
 * doc, doctor probe, trial). Until that API lands each read answers from here; the hooks of `hooks/swr` are its only callers, so the
 * switch to the generated GraphQL operations changes this module and those hooks and nothing above them.
 */

/** Everything the hub and the list pages read: the builds, the guides, the articles, the doctor results and the trials. */
export const readHarnessCatalog = async (locale: string): Promise<HarnessCatalogView> => {
    const l = harnessLocaleOf(locale)
    return {
        builds: buildRowsOf(l),
        guides: guideRowsOf(l),
        docs: docRowsOf(l),
        doctors: doctorsOf(l),
        trials: trialRowsOf(l),
    }
}

/** One build with its stages and the newest e2e result of each; undefined when no build carries the id. */
export const readHarnessBuild = async (id: string, locale: string): Promise<HarnessBuildView | undefined> =>
    buildOf(id, harnessLocaleOf(locale))

/** One guide of part 2 with its markdown; undefined when no guide carries the slug. */
export const readHarnessGuide = async (slug: string, locale: string): Promise<HarnessGuideView | undefined> =>
    guideOf(slug, harnessLocaleOf(locale))

/** One article of part 3 with its markdown; undefined when no article carries the slug. */
export const readHarnessDoc = async (slug: string, locale: string): Promise<HarnessDocView | undefined> =>
    docOf(slug, harnessLocaleOf(locale))
