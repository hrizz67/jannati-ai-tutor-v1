# P2.1 Local-First Conversation Router

## Status

PR1 implements local-only routing. Remote generative execution remains disabled. The router may classify a turn as `REMOTE_ELIGIBLE`, but it returns a local uncertainty response and performs no network request.

## Future remote fallback interface

A future, separately reviewed adapter may accept only this bounded request:

```text
RemoteFallbackRequest
- locale
- intent
- approvedEvidenceIds[]
- sanitizedMessage
- sanitizedHistory[] (maximum six turns)
- subjectId/topicId/questionId
- supportStage
- answerRevealPolicy
```

It may return only:

```text
RemoteFallbackResult
- text
- quickReplies[] (maximum three)
- intent
- confidence
- evidenceIds[]
- canAnswerSafely
- needsAdultHelp
- usage { inputTokens, outputTokens }
```

The adapter must not receive a name, email, account ID, child ID, learner profile, transcript, audio, raw progress history, canonical answer protected by the reveal policy, or provider credential from the browser.

## Mandatory gates before a remote adapter can be connected

Every gate must be verified server-side and fail closed:

1. Guardian consent specifically for text AI, scoped to the active child, purpose and notice version, with immediate revocation.
2. Provider eligibility for data belonging to children and the applicable age group.
3. Authenticated server-side authorization and canonical child ownership.
4. Approved privacy, retention and deletion policy, including verified zero-data-retention requirements where applicable.
5. Durable per-account, per-child and global daily quotas.
6. A hard zero-spend policy: no paid overflow, no card-backed automatic overage, and a server kill switch.
7. Approved curriculum evidence IDs and deterministic Mathematics verification.
8. Input and output safety, personal-data, factual, language, age and answer-reveal validation.
9. Automatic fallback to the local response for timeout, rejection, unsafe output, quota exhaustion or provider failure.

No real API call, cloud conversation storage or frontend provider secret is authorized by this contract.
