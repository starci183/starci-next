/**
 * The content capability (the gitmount).
 *
 * The cli runs `ContentSyncService.sync`: it pulls the content repository and the teacher's data repository into versioned
 * snapshots `<datasourcesDir>/<sha>/` with a `manifest.json` (or takes local checkouts), then runs the lesson, interview, review and
 * practice imports at that version and records the catalogs the content repository holds. The app root passes the git mount
 * parsed by `parseContentConfig`.
 */
export { parseContentConfig } from "./content.config"
export { ContentModule } from "./content.module"
export { ContentSyncService } from "./content-sync.service"
