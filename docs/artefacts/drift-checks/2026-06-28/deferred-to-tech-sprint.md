# Deferred to tech-error-handling sprint — drift-check 2026-06-29

Per the pseudo-vs-tech-separation rule, n8n error-handling MECHANISMS are not `.pseudo` concerns.

- **WF-26 D6 — UPDATE 0-row "halt".** `.pseudo` Step 2 says the status UPDATE "halts on 0 affected rows
  — contract failure," but live `Update User Status` has no `onError`/`ON_ERROR_STOP` config, so a 0-row
  UPDATE succeeds silently. This is an error-handling mechanism (whether a 0-row write should hard-stop),
  not business-logic drift. Decide in the tech-error sprint whether re-engaged-opted-out re-route should
  hard-fail on a 0-row status flip. Not gating; not counted as drift.
