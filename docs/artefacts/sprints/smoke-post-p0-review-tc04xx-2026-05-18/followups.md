# Followups — smoke-post-p0-review-tc04xx-2026-05-18

## [2026-05-18] — During BUG-04 (WF-25 reliability)

- **WF-25 model 503 risk:** `gemini-2.5-flash-lite` returned `503 Service unavailable - This model is currently experiencing high demand` on the verification run (execution 1303). Transient Google-side capacity issue. Existing `retryOnFail=true` on the HTTP node helps. If 503s become frequent, consider model fallback to `gemini-2.0-flash-lite` — CLAUDE.md states `gemini-2.0-flash-lite` is the project default but WF-25 currently calls `gemini-2.5-flash-lite`. Decision needed: align on one model.

- **WF-23, WF-30, WF-44 empty userStatus on WF-25 call:** All three call WF-25 in `defineBelow` mappingMode and map `userStatus: {{ $json.userStatus }}` — but their upstream context lacks a flat `userStatus` field (User State Router produces nested `user.status`). So WF-25 receives empty/undefined `userStatus` from these callers. Prompts render `Status: unknown`. Not BUG-04 scope (none route on `consultation_closed`), but caller-side mapping should be fixed to `={{ $json.user.status }}` for consistency.

## [2026-05-18] — During BUG-01 (Postgres queryReplacement sweep)

- **WF-60 (6H75p935FpBVBQtV)** "Log to Messages Table": the `content` parameter in the queryReplacement array is wrapped in literal double-quotes via `"\"" + $json.content + "\""`. With proper parameter binding (the BUG-01 fix), the Postgres driver auto-quotes string values for safe insertion — these manual outer quotes likely cause the `content` column to store `"actual text"` (with literal quote characters as part of the value), not `actual text`.
  - Found while: applying BUG-01 array-form fix; preserved as-is to keep scope minimal.
  - Investigate: select a recent row from `chinmay_astro.messages` and check whether `content` values are wrapped in literal `"`. If yes, remove the wrap (change to plain `$json.content` inside the array).
