# Requirements Document

## Introduction

This feature adds a **Live Rate Display** to the Ceritage ERP dashboard by integrating with the MCX (Multi Commodity Exchange) API. The backend will poll MCX for current gold, silver, and commodity rates and cache them. The frontend will display these rates in near real-time in two places: the existing "Live Rates" ticker in the top navigation bar, and a dedicated Live Rates card on the `DashboardHome` module. The `Rates` module's "Live API" tab will also be wired to trigger a manual fetch and display connection status.

---

## Glossary

- **MCX**: Multi Commodity Exchange of India — the primary commodity exchange from which live metal prices are sourced.
- **Rate_Fetcher**: The backend service/module responsible for calling the MCX API and caching rate data.
- **Rate_Cache**: The in-memory or database-backed store holding the most recently fetched MCX rates with a timestamp.
- **Live_Rate_Ticker**: The small rate display element in the top navigation bar of the Dashboard layout (`Dashboard.jsx`).
- **Live_Rate_Card**: The dedicated card component on the `DashboardHome` module displaying current gold, silver, and platinum rates with directional indicators.
- **Rate_API_Endpoint**: The backend REST endpoint (`/api/rates/live`) that serves cached MCX data to the frontend.
- **Polling_Interval**: The configurable period at which the backend re-fetches rates from MCX (default: 5 minutes).
- **Stale_Threshold**: The maximum age of cached data beyond which the system treats rates as unavailable (default: 15 minutes).
- **Dashboard**: The main authenticated shell (`Dashboard.jsx`) containing the sidebar, top bar, and module area.
- **DashboardHome**: The default landing module rendered when the Dashboard is first loaded (`DashboardHome.jsx`).
- **Rates_Module**: The existing `Rates.jsx` module for managing and viewing gold/silver rates.

---

## Requirements

### Requirement 1: Backend MCX API Integration

**User Story:** As a store owner, I want the system to automatically fetch current gold and silver rates from MCX, so that my staff always sees up-to-date market prices without manual data entry.

#### Acceptance Criteria

1. WHEN the backend server starts, THE Rate_Fetcher SHALL immediately fetch current rates from the configured MCX API endpoint within 10 seconds of server startup completion.
2. WHEN the Polling_Interval elapses, THE Rate_Fetcher SHALL re-fetch rates from the MCX API and update the Rate_Cache with the new rates and a new UTC timestamp.
3. IF the MCX API request fails or does not respond within 10 seconds, THEN THE Rate_Fetcher SHALL retain the previously cached rates unchanged, and log the error with a UTC timestamp and the reason for failure.
4. IF the MCX API returns a response missing one or more required fields (rate_22k, rate_24k, rate_18k, silver_rate, platinum_rate, or timestamp), or containing non-numeric values for any rate field, THEN THE Rate_Fetcher SHALL reject that response, retain the previous cache unchanged, and log a parsing error with a UTC timestamp.
5. THE Rate_Cache SHALL store at minimum: rate_22k, rate_24k, rate_18k, silver_rate, platinum_rate (all as positive numeric values in INR per gram, with up to 2 decimal places), the UTC timestamp of the last successful fetch, and the data source label "MCX".
6. WHERE an MCX API key is configured via the `MCX_API_KEY` environment variable, THE Rate_Fetcher SHALL include it in the Authorization header of each request.
7. THE Rate_Fetcher SHALL support a configurable Polling_Interval set via the `LIVE_RATE_POLL_INTERVAL_MS` environment variable, defaulting to 300000 milliseconds (5 minutes), with a minimum accepted value of 60000 milliseconds (1 minute).
8. IF the `LIVE_RATE_POLL_INTERVAL_MS` environment variable is set to a value below 60000 or is not a valid positive integer, THEN THE Rate_Fetcher SHALL log a configuration error indicating the invalid value and fall back to the default interval of 300000 milliseconds.
9. WHEN the Rate_Fetcher completes a successful fetch and cache update, THE Rate_Fetcher SHALL make the updated rates available in the Rate_Cache within 2 seconds of receiving the MCX API response.

---

### Requirement 2: Live Rate Backend Endpoint

**User Story:** As a frontend developer, I want a single backend endpoint that returns the latest cached MCX rates, so that the frontend can display them without directly calling MCX.

#### Acceptance Criteria

1. THE Rate_API_Endpoint SHALL require a valid JWT token on all requests to `/api/rates/live` and `/api/rates/live/refresh`, rejecting unauthenticated requests with HTTP 401.
2. WHEN a valid authenticated GET request to `/api/rates/live` is received and the Rate_Cache is populated and not stale, THE Rate_API_Endpoint SHALL respond within 500ms with HTTP 200 and a JSON body containing: `success: true`, the Rate_Cache contents in `data`, and `stale: false`.
3. IF the Rate_Cache was last updated more than the Stale_Threshold ago, THEN THE Rate_API_Endpoint SHALL respond with HTTP 200, `success: true`, `stale: true`, the last known Rate_Cache contents in `data`, and the timestamp of the last successful update in `last_updated`.
4. IF the Rate_Cache is empty (no successful fetch has occurred), THEN THE Rate_API_Endpoint SHALL respond with HTTP 503 and a JSON body containing `success: false` and an error message indicating rates are unavailable.
5. WHEN a valid POST request to `/api/rates/live/refresh` is received from a caller with the `rates:edit` permission, THE Rate_API_Endpoint SHALL trigger an immediate MCX re-fetch and respond with HTTP 200 and `success: true` once the cache has been updated.
6. IF a POST request to `/api/rates/live/refresh` is received from a caller without the `rates:edit` permission, THEN THE Rate_API_Endpoint SHALL respond with HTTP 403 and a JSON body containing `success: false` and an error message indicating insufficient permissions.
7. IF the MCX re-fetch triggered by `/api/rates/live/refresh` does not complete within 10 seconds, THEN THE Rate_API_Endpoint SHALL respond with HTTP 504 and a JSON body containing `success: false` and an error message indicating the refresh timed out, leaving the existing Rate_Cache unchanged.

---

### Requirement 3: Live Rate Ticker in Top Navigation Bar

**User Story:** As a staff member, I want to see the current gold and silver rates in the top bar of every dashboard page, so that I can quote prices to customers without switching modules.

#### Acceptance Criteria

1. WHEN the Dashboard is loaded, THE Live_Rate_Ticker SHALL initiate a fetch to the Rate_API_Endpoint within 3 seconds of the component mounting.
2. WHILE the Dashboard is open, THE Live_Rate_Ticker SHALL re-fetch rates from the Rate_API_Endpoint every 5 minutes.
3. WHEN the Rate_API_Endpoint returns a successful response with `stale: false`, THE Live_Rate_Ticker SHALL display the 22K gold rate and silver rate in the format `22K: ₹X,XXX | Ag: ₹XX`, where the rate values are whole numbers in Indian Rupees per gram with no decimal places.
4. WHILE the initial rate fetch is in progress and no previously fetched rate exists, THE Live_Rate_Ticker SHALL display a loading placeholder text in place of rate values.
5. IF the Rate_API_Endpoint returns a response with `stale: true`, THEN THE Live_Rate_Ticker SHALL append a stale indicator symbol immediately after the rate values, which must be visually distinct from the rate text.
6. IF the Rate_API_Endpoint returns an error response, returns no response within 3 seconds of the fetch being initiated, or is unreachable, THEN THE Live_Rate_Ticker SHALL display the text `Live Rates: Unavailable` and SHALL NOT display any previously fetched rate values.
7. THE Live_Rate_Ticker SHALL render its loading placeholder independently, such that other dashboard elements complete their own rendering without waiting for the Live_Rate_Ticker to display rate values.

---

### Requirement 4: Live Rate Card on DashboardHome

**User Story:** As a store manager, I want a prominent live rates card on the main dashboard, so that I can monitor gold and silver prices at a glance alongside my KPIs.

#### Acceptance Criteria

1. WHEN DashboardHome loads, THE Live_Rate_Card SHALL be rendered in the two-column grid below the KPI stat cards.
2. THE Live_Rate_Card SHALL display individual tiles for: 22K Gold, 24K Gold, 18K Gold, Silver, and Platinum — each showing the rate in ₹/g rounded to 2 decimal places.
3. IF the fetched rate for a metal differs from the rate stored in the local `gold_rates` database table, THEN THE Live_Rate_Card SHALL display a directional arrow (▲ for higher, ▼ for lower) and the absolute difference in ₹/g rounded to 2 decimal places alongside that metal's tile.
4. IF no prior rate exists in the local `gold_rates` database table for a metal, THEN THE Live_Rate_Card SHALL display the fetched rate for that metal's tile without a directional arrow or difference value.
5. THE Live_Rate_Card SHALL display the timestamp of the last successful MCX fetch in the format `Last updated: HH:MM AM/PM`; IF no successful fetch has occurred, THEN THE Live_Rate_Card SHALL display `Last updated: —` in place of the timestamp.
6. IF the fetched data has `stale: true`, THEN THE Live_Rate_Card SHALL render a "Stale data" badge in the card header.
7. IF the live data fetch returns an error response or a null/empty payload, THEN THE Live_Rate_Card SHALL display placeholder dashes (—) for each metal rate and a message indicating MCX rates are unavailable.
8. THE Live_Rate_Card SHALL include a "Refresh" button that re-fetches live rate data when clicked; WHILE the fetch is in progress, THE Live_Rate_Card SHALL disable the "Refresh" button and display a loading indicator on it.
9. IF the live rate refresh request fails, THEN THE Live_Rate_Card SHALL re-enable the "Refresh" button and display an error message indicating the refresh failed, without altering the previously displayed rate values.

---

### Requirement 5: Rates Module — Live API Tab Wiring

**User Story:** As an admin, I want the "Live API" tab in the Rates module to actually connect to the backend and fetch live rates, so that I can verify the integration and trigger manual updates.

#### Acceptance Criteria

1. WHEN the "Fetch Now" button in the Live API tab is clicked, THE Rates_Module SHALL call `POST /api/rates/live/refresh` and display a success message or an error message indicating the failure reason within 10 seconds.
2. WHEN the "Test Connection" button is clicked, THE Rates_Module SHALL call `GET /api/rates/live` and display the response status (success or failure), the last-fetched timestamp in ISO 8601 format, and whether the data is stale, where stale is defined as the last-fetched timestamp being older than 60 minutes.
3. IF the MCX API key field contains a non-empty value of 1–256 characters and "Save Settings" is clicked by a user with the `rates:edit` permission, THEN THE Rates_Module SHALL submit the key to the backend via `POST /api/settings/live-rate`, and THE backend SHALL use the saved key for all subsequent MCX API requests.
4. IF "Save Settings" is clicked and the MCX API key field is empty, THEN THE Rates_Module SHALL display a validation error indicating that the API key field is required, and SHALL NOT submit the request.
5. WHEN a successful fetch is triggered from the Live API tab, THE Rates_Module SHALL update the rate cards at the top of the page to reflect the newly fetched values without requiring a full page reload.
6. IF the user does not have the `rates:edit` permission, THEN THE Rates_Module SHALL disable the "Fetch Now" and "Save Settings" buttons and display a read-only notice.
7. IF `POST /api/rates/live/refresh` or `POST /api/settings/live-rate` does not return a response within 10 seconds, THEN THE Rates_Module SHALL display a timeout error message indicating the request timed out and SHALL re-enable the triggering button.

---

### Requirement 6: Rate Data Serialization and Parsing

**User Story:** As a developer, I want MCX API responses to be reliably parsed and formatted, so that rate data is never silently corrupted before display or storage.

#### Acceptance Criteria

1. THE Rate_Fetcher SHALL parse numeric rate values from the MCX API response and convert them to INR-per-gram floating-point numbers rounded to exactly 2 decimal places.
2. THE Rate_Fetcher SHALL validate that each parsed rate value is a positive finite number in the range 0.01 to 999999999.99 before storing it in the Rate_Cache.
3. IF a parsed rate value fails validation, THEN THE Rate_Fetcher SHALL exclude that metal's rate from the cache update and emit a warning identifying the metal and the received value.
4. FOR ALL valid rate objects passing through the Rate_Fetcher, serializing the object to JSON and then parsing it back SHALL produce a numerically equivalent object, where each rate value matches the original within a tolerance of ±0.005.
5. IF the MCX API response is missing one or more required rate fields, THEN THE Rate_Fetcher SHALL treat the entire response as invalid, retain the previous cache, and emit an error identifying the missing fields.

---

### Requirement 7: Configuration and Environment

**User Story:** As a system administrator, I want all MCX integration settings to be configurable via environment variables, so that I can manage credentials and behavior without modifying source code.

#### Acceptance Criteria

1. THE backend SHALL read the MCX API base URL from the `MCX_API_URL` environment variable.
2. THE backend SHALL read the MCX API key from the `MCX_API_KEY` environment variable.
3. THE backend SHALL read the polling interval from `LIVE_RATE_POLL_INTERVAL_MS`, defaulting to 300000 ms, and SHALL reject any value less than 1000 ms or greater than 3600000 ms by treating it as absent and applying the default.
4. THE backend SHALL read the stale threshold from `LIVE_RATE_STALE_THRESHOLD_MS`, defaulting to 900000 ms, and SHALL reject any value less than the configured polling interval or greater than 86400000 ms by treating it as absent and applying the default.
5. IF `MCX_API_URL` is absent or empty at startup, THEN THE backend SHALL log a warning message indicating which variable is missing and disable automatic polling.
6. IF `MCX_API_KEY` is absent or empty at startup, THEN THE backend SHALL log a warning message indicating which variable is missing and disable automatic polling.
7. WHILE automatic polling is disabled due to a missing required environment variable, THE backend SHALL serve the `/api/rates/live` endpoint using the most recently cached or database-stored rates without initiating any outbound MCX API calls.
