# CTA Decision Gate

Purpose: prevent technically correct previews from ending in vague, low-commitment calls to action.

## Release rule

A Product Lab asset may ship only when its CTA asks the client to make one observable commercial decision tied to the confirmed problem.

Required fields:

- `confirmed_problem`: copied from the Evo company record, not inferred elsewhere.
- `decision_requested`: exactly one of `approve_example_scope`, `provide_missing_input`, `book_review`, `approve_limited_pilot`.
- `client_effort`: one short sentence stating what the client must do.
- `ally_commitment`: one short sentence stating what Ally AI will deliver next.
- `success_signal`: an observable outcome of the next step.
- `stop_condition`: when no further work should be done.
- `cta_label`: verb-first, specific, and no more than 6 words.
- `destination`: one working link or form target.
- `event_name`: analytics event for CTA activation.

## Validation

Reject the asset when any of these are true:

1. More than one primary CTA is visible.
2. The CTA uses vague wording such as “Learn more”, “Contact us”, or “See possibilities”.
3. The client cannot tell what happens after clicking.
4. The CTA asks for a meeting when the confirmed request only requires an example or missing data.
5. The destination fails on 360 px mobile width or opens an unrelated page.
6. The CTA cannot be traced back to the confirmed Evo problem and interest event.
7. No analytics event confirms activation.

## Minimal output example

- Confirmed problem: `[from Evo]`
- CTA: `Approve the example scope`
- Client action: confirm the proposed page or use case.
- Ally AI action: prepare one constrained preview.
- Success signal: scope confirmed in Evo.
- Stop condition: no confirmation or explicit decline.
- Event: `product_lab_cta_approve_scope`

## Method improvement

Previous gates checked whether a CTA existed. This gate checks whether the CTA creates one measurable decision with bounded effort and a defined next delivery.

`next_cycle_rule`: before creating any new Product Lab component, inspect the latest repository method changes and improve the first missing conversion step rather than adding another general checklist.
