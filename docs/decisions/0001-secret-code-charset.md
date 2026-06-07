# 0001. Secret code charset and length

**Date**: 2025-12-01
**Status**: Accepted

## Context

Non-admin race-day users (judges, head judges, event loggers) authenticate by
entering a short code instead of a username/password. The code must be:

- Easy to type on a phone or tablet at the venue.
- Easy to read off a printed slip in bright sunlight.
- Hard to guess (within reason — these codes are short-lived and round-scoped, not bank-grade credentials).
- Unique within an event.

The generator is `generateSecretCode()` in [components/rounds/round-form.tsx](../../components/rounds/round-form.tsx);
join validation lives in [app/actions/officials.ts](../../app/actions/officials.ts).

## Decision

- **Length**: 6 characters.
- **Charset**: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — uppercase letters and digits, **excluding** ambiguous characters: `I`, `O`, `0`, `1` (32 characters total).
- **Randomness**: `crypto.getRandomValues` (Web Crypto, cryptographically secure)
  over a `Uint8Array(6)`, with `byte % 32`. Because 256 is a multiple of 32 there is
  no modulo bias. Codes that collide with another round in the same event are
  regenerated (`genUniqueSecret`, up to 50 retries).
- **Scope/uniqueness**: one code per official per round (`RoundOfficial.secretCode`).
  Although the DB only enforces `@@unique([roundId, secretCode])`, codes are guarded
  **event-wide** at write time (`assertEventUniqueSecretCodes`) because rounds can run
  simultaneously and join matches a code across the whole event.
- **Validation**: the join form uses `InputOTP` from `input-otp` with
  `REGEXP_ONLY_DIGITS_AND_CHARS`, length 6, uppercased.

## Alternatives considered

| Option | Why rejected |
|--------|--------------|
| 4-character code | Too few combinations; high collision risk in a single event |
| 8-character code | Slower to type; unnecessary entropy for this use case |
| Lowercase + uppercase | Case sensitivity confuses users reading from print |
| Include `0`/`O`/`I`/`1` | Confusion between `0`/`O` and `1`/`I` causes typing errors, especially on printed slips |
| Full alphanumeric (incl. lowercase) | Same readability problem, plus doubles input modes on mobile keyboards |
| UUID / GUID | Way too long to type |
| `Math.random()` for generation | Not cryptographically secure; replaced with `crypto.getRandomValues` |

## Consequences

**Positive**

- Codes look like `K7H3DF` — instantly readable, no ambiguity.
- 32 characters × 6 positions = ~1 billion combinations. Plenty for an event with dozens of officials.
- `InputOTP` provides per-character slot UX, which feels right for a code (vs. one wide text input).
- Cryptographically-secure generation removes the predictability concern that a
  PRNG would have introduced.

**Negative**

- 6 characters is still short enough that an attacker who learns the event's URL
  pattern could try to brute-force a code. **Mitigation (implemented):** the
  `joinAsOfficial` action is rate-limited to `JOIN_MAX_ATTEMPTS = 10` per
  `JOIN_WINDOW_MS = 60_000` ms per IP per event (`lib/rate-limit.ts`).
- Excluding `0` and `1` means the entropy is `32^6`, not `36^6` — fewer combinations
  than naive expectation. Still ample for this scale.

## Related

- [features/secret-code-access.md](../features/secret-code-access.md)
- [features/round-configuration.md](../features/round-configuration.md)
