# Decisions — Timestamp Convention Sprint

Decisions captured during build-sprint execution. Each entry records the open question, the user's answer, the implications for downstream work, and the date the decision was taken.

---

## D1 — Admin Slack display timezone (spec §9 Q2, sprint item P2-PF-4)

**Decision date:** 2026-05-18T14:18Z
**Asked of:** Prasad
**Question:** For admin-facing Slack messages like "Paid at X", which timezone should the displayed timestamp use — Sydney AEDT/AEST, IST, or UTC?

**Decision:** Avoid displaying absolute timestamps in Slack messages where possible. Use relative phrasing such as **"User XYZ confirmed payment just now"** instead. Where an absolute timestamp must be shown, **use IST**.

**Rationale (user's words, summarised):**
- The real "admin" post-go-live is the customer **Chinmay Astro** (the astrology service operator), not Prasad. Prasad is in the Slack workspace only as the application builder/support.
- Chinmay Astro operates in IST and serves IST-based users. The natural display TZ in Slack is therefore IST, not Sydney.
- WhatsApp side requires no app-level conversion — the user's phone displays the WhatsApp message at its local TZ automatically.
- For Slack, embedding a specific timestamp in the message body is fragile if Chinmay Astro reads it hours later. Slack already exposes the **message delivery timestamp** in its own UI — Chinmay Astro can derive "when this happened" from that.
- Using relative phrasing ("just now", "earlier today", etc.) lets the Slack delivery timestamp serve as the authoritative absolute reference and avoids encoding TZ assumptions into the message body.
- Caveat noted by the user: if users in a non-IST country are accepted in future, "just now" remains correct because it's relative to send-time, not user wall-clock. For any absolute display that survives the next product iteration, IST is the chosen zone.

**Impact on P2-2.5 (Phase 2 audit of message-send workflows):**
1. For each timestamp-displaying expression found in WF-32, WF-33, WF-34, WF-42, WF-43, WF-44, WF-50, WF-51:
   - **Preferred fix:** rewrite the surrounding copy to use relative phrasing ("just now", "earlier today", or omit time entirely) so the absolute timestamp is dropped from the message body. Slack's message-delivery timestamp is sufficient for the admin.
   - **Fallback (when an absolute timestamp must remain):** wrap with IST conversion:
     ```
     {{ DateTime.fromISO($json.<field>).setZone('Asia/Kolkata').toFormat('dd LLL yyyy, hh:mm a') }}
     ```
   - **Do not** add Sydney AEDT/AEST conversion. Prasad is not the production admin.
2. The audit's per-hit classification gains a third bucket: `relative-rewrite` (preferred) in addition to `ist-convert` (fallback) and `internal-no-action`.

**Impact on memory + CLAUDE.md:**
- No change needed to `feedback_timestamp_convention.md` or the CLAUDE.md "Timestamp Convention" section. Those govern timestamps Claude writes to **artefacts** — internal wire format. Display-time conversion is an orthogonal concern handled at the message-render boundary in workflows.

---

## D2 — P2-2.2 spot-check row selection (spec §9 Q3, sprint item P2-PF-5)

**Decision date:** 2026-05-18T14:18Z
**Asked of:** Prasad
**Question:** For the post-migration spot-check after the `ALTER COLUMN ... USING (col AT TIME ZONE 'Asia/Kolkata')` conversion, which rows should be sampled per affected column?

**Decision:** **Default — earliest, latest, plus one row with non-null `verified_at` per affected column.**

**Rationale:**
- Three rows per column gives temporal spread (earliest + latest) plus one row where the nullable column actually carries a value. Without the `verified_at`-shaped row, a nullable-column USING-clause failure could silently pass validation.
- Tables are small pre-go-live, so the alternative "all rows" is feasible but generates a much larger validation artefact for no additional confidence.

**Impact on P2-2.2 step 1 ("Pre-capture before-state values"):**
For each of the 6 columns being migrated, pick rows as follows:

| Column | Sample rows (per column) |
|---|---|
| `consultations.started_at` | earliest non-null, latest non-null, one row where `ended_at` is also non-null |
| `consultations.ended_at` | earliest non-null, latest non-null, one row where `ended_at` is also non-null (same row may serve all 3 cols) |
| `consultations.created_at` | earliest, latest, one row where `created_at` is non-null (trivially true — has a default) |
| `payments.created_at` | earliest, latest, one row where `verified_at` is non-null |
| `payments.verified_at` | earliest non-null, latest non-null, one row with non-null `verified_at` (intersect: just the earliest + latest non-null pair, plus one mid-range non-null) |
| `payments.rejected_at` | earliest non-null, latest non-null, one row with non-null `rejected_at` |

If a column has fewer than 3 non-null rows in total (very likely pre-go-live), sample whatever rows do exist with non-null values and note in `migration-before.txt` that the column has <3 non-null rows.

---

## Notes

- Decisions recorded by build-sprint execution, captured via AskUserQuestion at 2026-05-18T14:18Z. State.md updated with `decision_made` notes and items advanced from `needs-decision` to `done`.
- No further decisions outstanding for this sprint at this checkpoint.
