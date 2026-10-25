# Windpark-Buchhaltung

The Z1 windpark ledger stores park records, monthly production, income and expenses in an append-only-at-entry-level JSON file. Entries are not overwritten through the API. The application shows documented entries separately from user-reported entries and never fills missing values with estimates.

## Start locally

1. Use Node.js 22 or newer and install the repository dependencies.
2. Configure a high-entropy `Z1_WINDPARK_API_TOKEN` in the Z1 API process environment. Keep the value private.
3. Optionally set `Z1_WINDPARK_DATA_FILE` to a private persistent path outside the repository. The default is `data/windpark-accounting.json`, which is excluded from Git.
4. Start the Z1 API (`npm run z1:api`) and web app (`npm run dev`). Open `/windparks.html`.

Open `/windparks.html`, enter the configured Z1 API token in the access field, and choose **Verbinden**. The browser holds the token in memory for the page session; the web server proxies only `/api/z1/windparks` and forwards its authorization header. The API requires the token for reads and writes. Without server configuration, it returns `503`; a missing or incorrect token never enables unauthenticated access.

## Record rules

- Create a park with its name and location. Operator, legal entity, MaStR ID and ownership-document reference are optional fields. The record remains marked **user reported, unverified**; this software does not verify title or permit status.
- Each entry requires a date, month, category, description and source reference. A source reference identifies a document or reported source; the system does not independently verify it.
- Use `documented` only when a supporting document has been supplied and identified. Use `reported` for an unverified value. The summary keeps those amounts separate.
- Production is stored in integer kWh. Income and expenses are stored in integer euro cents. Expense classes separate operating costs from interest, principal, tax, investment and reserves.
- Operating result is documented income less documented operating costs. Documented cash flow is documented income less all documented expenses, including financing and investment outflows. Reported values are displayed separately.
- A displayed zero means no qualifying entries have been recorded for that measure; it is not a statement that the park had no real activity. The dashboard shows coverage and leaves unrecorded park-months open.

## Current integration boundary

The ledger does not connect to banks, meters, market settlement systems or permit registries. Import and automated reconciliation require a data source and credentials to be configured. No source files or credentials were available when this feature was added, so the ledger starts empty and contains no claimed windpark cashflows.
