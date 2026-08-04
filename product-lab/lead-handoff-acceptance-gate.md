# Product Lab Lead Handoff Acceptance Gate

Purpose: prevent Product Lab from building a personal asset before the commercial signal and client problem are traceable to Evo.

## Acceptance rule

A lead is `READY_FOR_PRODUCT_LAB` only when every required field below is present and supported by Evo. Otherwise the lead is `RETURN_TO_ACQUISITION` with one explicit missing item.

| Field | Required evidence | Reject when |
|---|---|---|
| `company` | Evo company record | Company cannot be uniquely identified |
| `interest_event` | Exact request for a preview, price, implementation detail, pilot, or call | Interest is inferred from opens, clicks, or silence |
| `interest_timestamp` | Date and time from Evo history | Event freshness is unknown |
| `client_problem` | Client-stated or explicitly confirmed problem | Problem comes only from our audit |
| `source_excerpt` | Short factual paraphrase plus Evo event reference | No traceable source exists |
| `requested_outcome` | What the client wants to understand or decide next | Outcome is invented by Product Lab |
| `commercial_next_step` | One decision: review example, provide data, book a short call, or approve a limited pilot | Multiple competing CTAs exist |
| `owner` | Named person responsible for the next action | Ownership is unclear |

## Minimal handoff record

```yaml
status: READY_FOR_PRODUCT_LAB | RETURN_TO_ACQUISITION
company: ""
evo_record: ""
interest_event: ""
interest_timestamp: ""
client_problem: ""
source_excerpt: ""
requested_outcome: ""
commercial_next_step: ""
owner: ""
missing_item: ""
```

## Product Lab build limit

When accepted, create only the smallest asset needed to answer the client's confirmed question. Do not add unrelated features, speculative ROI, invented testimonials, or a second CTA.

## Release check

Before recording the result in Evo, verify:

- public URL opens without authentication;
- mobile layouts at 360, 375, and 390 px remain readable;
- all links and the single CTA work;
- the first screen states the confirmed problem and the specific value of the asset;
- trust language distinguishes verified facts from hypotheses;
- the commercial next step is visible and unambiguous;
- the final URL, verification result, owner, and next action are written back to Evo.

## Method improvement

Previous gates focused on asset quality after work had already started. This gate moves the decisive control upstream: Product Lab must reject an incomplete handoff before spending build effort.

## Next-cycle rule

Do not create a personalised preview unless `interest_event`, `client_problem`, and `commercial_next_step` are all present in Evo and traceable to the same company history.