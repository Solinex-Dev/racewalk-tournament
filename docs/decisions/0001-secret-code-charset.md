# 0001. Secret code charset and length

**Date**: 2025-12-01
**Status**: Accepted

## Context

Non-admin users (judges, head judges, event loggers, timekeepers) authenticate by entering a short code instead of a username/password. The code must be:

- Easy to type on a phone or tablet at the venue.
- Easy to read off a printed slip in bright sunlight.
- Hard to guess (within reason — these codes are short-lived and round-scoped, not bank-grade credentials).
- Unique within an event.

The implementation is in [generateRoundSecretCode()](../../components/rounds/round-form.tsx).

## Decision

- **Length**: 6 characters.
- **Charset**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — uppercase letters and digits, **excluding** ambiguous characters: `I`, `O`, `0`, `1`.
- **Validation**: the join form uses `InputOTP` from `input-otp` with `REGEXP_ONLY_DIGITS_AND_CHARS`, length 6.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| 4-character code | Too few combinations; high collision risk in a single event |
| 8-character code | Slower to type; unnecessary entropy for this use case |
| Lowercase + uppercase | Case sensitivity confuses users reading from print |
| Include `0`/`O`/`I`/`1` | Confusion between `0`/`O` and `1`/`I` causes typing errors, especially on printed slips |
| Full alphanumeric (incl. lowercase) | Same readability problem, plus doubles input modes on mobile keyboards |
| UUID / GUID | Way too long to type |

## Consequences

**Positive**

- Codes look like `K7H3DF` — instantly readable, no ambiguity.
- 32 characters × 6 positions = ~1 billion combinations. Plenty for an event with dozens of officials.
- `InputOTP` provides per-character slot UX, which feels right for a code (vs. one wide text input).

**Negative**

- 6 characters is still short enough that an attacker who learns the event's URL pattern could brute-force a code in a determined attempt. Mitigation: server-side rate limiting on the join endpoint (not yet implemented).
- Excluding `0` and `1` means the entropy is not `36^6` but `32^6` — fewer combinations than naive expectation. Still ample for this scale.

## Related

- [features/secret-code-access.md](../features/secret-code-access.md)
- [features/round-configuration.md](../features/round-configuration.md)
