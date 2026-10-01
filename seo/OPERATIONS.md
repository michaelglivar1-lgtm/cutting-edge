# Cutting Edge visibility maintenance

Scope: cuttingedgedesignfl.com and michaelglivar1-lgtm/cutting-edge, branch main. Cutting Edge focuses on high-end kitchens, bathrooms, interiors, landscape and outdoor living. Flood restoration, roof damage, water intrusion, seawall and dock work belongs to the separate company the owner most recently called Kosher Construction. Verify that other company's exact listing and legal name in its own project. Do not work on it during a Cutting Edge run. Never access the excluded suspended Brothers 59 Business Profile.

## Working loop

1. Read the latest repo, policy and the previous run's evidence. Preserve concurrent owner changes.
2. Run `node scripts/seo-audit.mjs`. The audit checks source metadata, canonical URLs, JSON-LD syntax, indexability, sitemap inclusion, service separation and crawler declarations on six priority pages. It does not measure rankings, traffic or revenue.
3. `node scripts/seo-audit.mjs --fix` can restore missing known canonical tags and missing priority sitemap entries, and remove accidentally reintroduced retired marine sitemap entries. It stops automatic repair if another validation issue is present or the five-file cap is exceeded. Never change policy just to make a check pass.
4. Validate fixes with `node scripts/test-seo-audit.mjs`, rerun the audit, and inspect the exact diff. Commit only the necessary repair to main using the authorized GitHub connection. Verify the deployment status and an actual rendered page. If live verification is unavailable, report that limitation instead of claiming production health.
5. Keep a dated receipt in the task's private run history: source commit, checks, observed problem, hypothesis, exact changes, validation and deployment evidence. Do not publish private traffic or customer data in this public site repository. Do not create no-op commits.
6. With an authenticated, successfully tested Search Console data connection, compare the latest complete 28-day period against the preceding 28 days by page and query; exclude incomplete recent days. Track clicks, impressions, CTR and position with sample sizes. Review AI referral traffic and accepted form submissions only through an authenticated analytics connection. Never invent missing metrics. At low volume, accumulate evidence rather than claiming improvement.
7. Make at most one evidence-supported content experiment per seven days and allow at least 28 days before judging its traffic effect. Record the baseline and hypothesis before editing; preserve a comparable period and note seasonality. Source repairs may run sooner. Add only useful, factually supported content. Never fabricate projects, customer reviews, business addresses, license details, prices or rankings. No mass city-page generation or cosmetic freshness rewrites.
8. Notify the owner for a verified corrective change, meaningful weekly progress, a regression or a new access blocker. Suppress repeated unchanged warnings. Do not silently call an unmeasured result a win.

## Limits

Routine source repair is authorized. Do not change ownership, authentication, address, phone, business name, ad budgets, security controls or customer data. Do not send external outreach. Do not move retired marine pages to another company or add redirects until that company's destination is verified. Keep existing review and access controls. The prior bulk-generation entry point is guarded, and daily-expand-fl now runs the bounded audit rather than releasing content blindly.

These are scheduled checks and measured experiments, not continuous model training or a guarantee of AI recommendations. Google Preferred Sources remains unavailable for the exact domain at the current baseline; do not substitute another business.
