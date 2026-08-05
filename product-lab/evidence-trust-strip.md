# Evidence Trust Strip

Use this compact module immediately before the primary CTA in every Product Lab preview. It must make the boundary between fact, proposal, and hypothesis obvious without adding a long explanation.

## Customer-facing structure

**Confirmed** — one observable fact or client-stated problem copied from the current Evo record.

**Proposed** — one concrete change that directly addresses that fact.

**To verify** — one clearly labelled hypothesis and the smallest reversible test.

**Next step** — one low-effort commercial decision with a working direct link.

## Minimal implementation

```html
<section class="evidence-strip" aria-labelledby="evidence-strip-title">
  <h2 id="evidence-strip-title">What this preview is based on</h2>

  <dl>
    <div>
      <dt>Confirmed</dt>
      <dd>{{confirmed_fact}}</dd>
    </div>
    <div>
      <dt>Proposed</dt>
      <dd>{{proposed_change}}</dd>
    </div>
    <div>
      <dt>To verify</dt>
      <dd>{{hypothesis_to_verify}}</dd>
    </div>
  </dl>

  <a
    href="{{cta_url}}"
    data-event="product_lab_primary_cta"
    data-preview-id="{{preview_id}}"
    data-company-id="{{evo_company_id}}"
  >
    {{primary_cta}}
  </a>

  <p class="next-step-note">{{what_happens_next}}</p>
</section>
```

The visible CTA text must name the decision, for example: “Approve the 7-day pilot scope” rather than “Learn more”. The supporting note must state what Ally AI will do after the click.

## Rules

- Never mix confirmed facts with hypotheses.
- Never invent losses, conversion, growth, urgency, testimonials, or outcomes.
- Use one proposed change and one CTA only.
- The CTA must state what happens next; do not send users to a generic contact page.
- Do not expose names, email addresses, message text, or other personal data in analytics attributes.
- Keep the strip readable without horizontal scrolling at 360, 375, and 390 px.
- The CTA must remain keyboard reachable and have a visible focus state.
- Verify every link before release.

## Verification checklist

1. Copy the confirmed fact from the current Evo record and preserve its meaning.
2. Read the strip alone: a reviewer must distinguish fact, proposal, and hypothesis without surrounding context.
3. Test the CTA destination in a logged-out browser state.
4. Test widths 360, 375, and 390 px; no clipped text or horizontal scrolling.
5. Navigate by keyboard; focus must be visible and activation must work.
6. Trigger one test click and confirm exactly one `product_lab_primary_cta` event with the correct `preview_id` and `company_id`.
7. Confirm the analytics payload contains no personal data.

## Release record

```yaml
preview_id: ""
evo_company_id: ""
confirmed_fact: ""
evo_evidence_timestamp: ""
proposed_change: ""
hypothesis_to_verify: ""
verification_method: ""
primary_cta: ""
cta_url: ""
what_happens_next: ""
mobile_checked_360: false
mobile_checked_375: false
mobile_checked_390: false
keyboard_checked: false
links_checked_logged_out: false
analytics_event_verified: false
analytics_contains_no_pii: false
```

## Method improvement

The previous version described trustworthy presentation but left implementation and measurement open to interpretation. This version provides a reusable semantic HTML pattern, a single privacy-safe CTA event, logged-out link verification, and accessibility checks. Reject a preview when evidence states are mixed, the CTA is vague, the destination fails outside an authenticated session, or the event cannot be verified.