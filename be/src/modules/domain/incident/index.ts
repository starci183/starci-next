/**
 * The incident list capability.
 *
 * `IncidentReadService.list` answers the live Essentials lessons as rows with `incidentAvailable` and a `status` of
 * `authored` or `coming-soon`. No incident is authored yet, so every row is coming soon; the app root names the authored
 * lessons through `IncidentModule.register({ authored })`. There is no incident runner here (it needs the relay and CLI).
 */
export { IncidentModule } from "./incident.module"
export { IncidentReadService } from "./incident-read.service"
export type { IncidentListItemView } from "./incident.contracts"
