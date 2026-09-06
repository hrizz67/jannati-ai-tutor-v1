# Known Issues

The following items remain active engineering or acceptance work for the v3.10.0 closed-beta baseline.

| Issue | Severity | Planned work | Notes |
| --- | --- | --- | --- |
| Desktop/mobile Supabase XP mismatch not physically closed | Critical for wider beta | Two-device sync investigation and evidence capture | Automated account/child isolation, CAS conflict, idempotency, deletion containment, and reload tests pass. A previously observed live XP mismatch means wider beta and paid release remain blocked until the same account and child converge on both devices without data loss. |
| Large production chunks | Medium | Performance sprint | The entry bundle and BM/Mathematics subject chunks still exceed the preferred warning threshold. |
| Real-device acceptance remains manual | Medium | Browser/device acceptance | iPhone Safari chrome, keyboard resizing, microphone, audio, safe areas, and tactile overlap require physical-device checks. |
| Curriculum metadata is partly inferred | Medium | Learning Journey Alignment V1 | SK, SP, estimated time, cognitive level, and some learning outcomes should progressively move from inferred to teacher-reviewed explicit metadata. |
| Some knowledge packs retain generic wording | Low | Learning Journey Alignment V1 | Notes and coaching examples should be checked against the exact skill and misconception for each topic. |
| Production deploy propagation can be delayed | Low | Release hardening | The automated smoke test retries the public HTML and hashed JavaScript asset after tagged deployment. |

## Release policy

- Stable releases require zero validation errors and zero validation warnings.
- Informational findings are allowed when a safe inference is recorded, but they remain visible for later teacher review.
- A deployment is not considered verified until the tagged commit, generated release metadata, build, deployment, and public smoke test all pass.
- Passing automated sync tests does not close a live cross-device data discrepancy; physical evidence is required before wider beta.
