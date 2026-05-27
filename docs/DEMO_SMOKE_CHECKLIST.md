# Demo Smoke Checklist

Run this before recording a demo or handing off.

## Creator flow
1. Open `/auth` and create an account (or login).
2. Open `/dashboard` and create a custom draft.
3. Open `/builder/[id]` and add at least:
   - short-text (required)
   - select with options
   - number with min/max
4. Save and publish.
5. Copy and open the public URL.

## Responder flow
1. Submit once with valid answers => expect success screen.
2. Submit with missing required field => expect validation error.
3. Submit with honeypot filled => expect rejection.
4. If form is AUTHENTICATED mode, verify anonymous submission is blocked.

## Analytics flow
1. Open `/forms/[id]/analytics`.
2. Verify summary cards are non-zero after submissions.
3. Verify time-series chart has data points.
4. Verify option distribution pie/bar renders for select/multi-select fields.

## API docs flow
1. Open API `/docs` (Scalar).
2. Verify endpoints for forms/public-forms/responses/analytics/templates are listed.
3. Verify protected endpoints are marked as auth-required.

## Known limitation
- Submission rate limit is in-memory in this build (single-instance demo-safe). The callsite is abstracted for Redis/Upstash upgrade.
