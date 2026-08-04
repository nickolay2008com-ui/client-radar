# No-Interest Fallback Selector

Use this only when Evo does not expose a company with confirmed interest, a request for an example, a price/implementation question, or a call request.

## Purpose

Prevent speculative personal demos while still producing one reusable improvement per Product Lab cycle.

## Selection rule

Choose exactly one component with the highest verified friction score:

`friction score = frequency × commercial impact × confidence ÷ implementation effort`

Use integers from 1 to 3 for each factor. Evidence is mandatory; an unsupported score is `0`.

## Candidate components

- Audit template
- CTA
- Form
- Trust module
- Analytics
- Payment
- Lead handoff

## Evidence required

For the selected component record:

- observed failure or repeated gap;
- source and observation time;
- affected commercial step;
- current behavior;
- smallest sufficient change;
- verification method;
- rollback condition.

## Release gate

The improvement is complete only when all are true:

- one component changed, not several;
- change is reusable across companies;
- no client-specific claim was invented;
- mobile behavior is checked when the component is user-facing;
- links and CTA are checked when present;
- expected benefit is stated as a hypothesis, not a promise;
- result is committed or otherwise stored in the operational repository;
- the next cycle receives one explicit rule derived from the result.

## Required cycle record

- `work.completed`
- `result.verified`
- `weakness.found`
- `hypothesis.created`
- `improvement.applied`
- `lesson.saved`
- `next_cycle_rule`

## Default next-cycle rule

Do not create a personal asset until Evo supplies both a confirmed-interest event and a current client problem. Until then, improve only the highest-scoring reusable bottleneck.