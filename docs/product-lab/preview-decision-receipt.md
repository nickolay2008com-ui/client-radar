# Preview Decision Receipt

Purpose: make every Product Lab preview produce one verifiable commercial outcome instead of an unqualified CTA click.

## Release rule

A preview is not commercially complete until its primary CTA writes a decision receipt or explicitly records that no decision was made.

## Minimal receipt

```json
{
  "schema": "product_lab.preview_decision.v1",
  "preview_id": "non-personal-stable-id",
  "company_id": "evo-company-id",
  "interest_event_id": "evo-interest-event-id",
  "decision": "request_example | send_inputs | book_review | discuss_pilot | decline | no_decision",
  "source": "primary_cta",
  "occurred_at": "ISO-8601 UTC",
  "consent_to_follow_up": true,
  "next_owner": "client | ally_ai | none",
  "next_action": "plain-language action",
  "evo_sync_status": "pending | synced | failed",
  "evo_record_url": null
}
```

## Required behaviour

1. Show one primary CTA only.
2. Explain the exact consequence before the click.
3. Do not infer consent from a page view or generic click.
4. Record `no_decision` only after an explicit close/skip action; never manufacture it from inactivity.
5. Keep personal data out of analytics payloads. Use Evo identifiers only.
6. Make receipt creation idempotent for the same `preview_id + interest_event_id + decision`.
7. If Evo is unavailable, queue the receipt with `evo_sync_status=pending`; do not claim synchronization.
8. After sync, store the returned Evo record URL and mark `synced`.

## Verification checklist

- CTA works at 360, 375 and 390 px widths.
- Keyboard activation and visible focus state work.
- One activation creates one receipt.
- Reload/retry does not duplicate the receipt.
- Analytics contains no email, name, phone or free-text client message.
- Failed Evo sync is observable and retryable.
- The rendered confirmation repeats the selected decision and the next owner.

## Commercial acceptance

The cycle result must be reported as one of:

- `decision_verified`: a valid receipt exists and is synced to Evo;
- `decision_pending_sync`: a valid receipt exists, Evo sync is pending;
- `no_decision`: the client explicitly declined or skipped;
- `unverified`: no valid receipt exists.

A CTA click alone is never reported as commercial progress.

## Method improvement

Previous rule: verify that the CTA exists, works and emits an analytics event.

Improved rule: verify that the CTA produces an explicit, idempotent commercial decision receipt and that its Evo synchronization state is observable.

## next_cycle_rule

Before improving another visual element, verify whether the current preview path can produce a valid decision receipt. If it cannot, fix that path first.
