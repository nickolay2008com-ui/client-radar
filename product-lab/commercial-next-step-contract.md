# Commercial Next-Step Contract

Use this reusable component after a preview, Upgrade Room, demo, offer, or implementation scenario is ready. Its job is to convert interest into one low-risk commercial decision without adding a second sales path.

## Required inputs

All inputs must come from Evo or from an explicitly linked first-party source:

- company and contact status;
- confirmed interest event;
- confirmed client problem;
- asset URL;
- evidence checked in the asset;
- unresolved unknowns;
- owner of the next action.

If either the interest event or the confirmed problem is missing, do not produce a personal commercial step.

## One-decision rule

The client must face exactly one primary decision:

> Approve a bounded next step to test the confirmed problem.

Do not combine a call request, paid pilot, integration, questionnaire, and document review in one CTA.

## Contract fields

- **Confirmed problem:** one sentence, copied or faithfully paraphrased from the verified history.
- **What is ready:** one sentence and one working URL.
- **Proposed next step:** one reversible action.
- **Scope included:** up to three concrete items.
- **Scope excluded:** integrations, production access, paid media, or other work not yet approved.
- **Client effort:** exact minimum input required from the client.
- **Our effort:** what Ally AI will deliver next.
- **Decision deadline:** only when the client supplied a real date; otherwise omit.
- **Success evidence:** one observable outcome, not a guaranteed metric.
- **Stop condition:** when the step should be paused or rejected.
- **Primary CTA:** one action label.
- **Fallback:** a non-promotional close such as “Not relevant now”.

## Default CTA patterns

Choose one only:

- `Approve the example scope`
- `Send the missing input`
- `Choose a 20-minute review slot`
- `Approve the bounded pilot`

Never use vague labels such as `Learn more`, `Discuss`, `Continue`, or multiple equal-weight buttons.

## Trust block

Place directly before the CTA:

- no production changes without approval;
- no access to private systems unless explicitly granted;
- no invented performance promise;
- the client can stop after the bounded step.

## Verification gate

The component is ready only when:

- the asset URL opens without authentication required from the client;
- the page has one visible primary CTA on 360 px width;
- CTA destination works;
- confirmed facts and hypotheses are visually separated;
- the next step can be understood in under 15 seconds;
- client effort is explicit;
- exclusions and stop condition are visible;
- the Evo record contains the asset URL, CTA, owner, and commercial status.

## Method improvement

Previous Product Lab gates mostly answered “is the asset valid?”. This contract adds the missing question: “what exact reversible decision should the client make next?”.

## Next-cycle rule

Do not release a client-specific asset unless it ends in one bounded, reversible, owner-assigned commercial decision and that decision is recorded in Evo.