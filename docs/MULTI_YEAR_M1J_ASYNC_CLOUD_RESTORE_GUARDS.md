# M1-J async cloud restore ownership

Status: **DRAFT / MERGE-HOLD**

Base: Draft PR #237 at `67ef046477f368a81786df5f7ba0b9c650426f3f`.

## Confirmed defects

Two cloud restore paths did not revalidate the active learner after awaited work:

- manual **Muat data cloud** could hydrate, apply, clear the pending outbox and announce success after an account or child switch;
- realtime revision restore could apply a previous child's active projection after its deferred restore import resolved.

The guarded manual sync and login hydration paths already used operation generations and current-owner callbacks. M1-J applies the same fail-closed contract to the two missing paths.

## Repair boundary

- A separate in-memory lease tracks account, child, Year 2 and a monotonic epoch.
- A committed child switch, child creation or logout invalidates the lease synchronously.
- Manual load also owns the existing cloud read lock and account sequence.
- A mutation or tombstone created during a read cancels restore and queues the durable outbox instead.
- Realtime account-wide metadata may be observed, but no stale active projection is hydrated or applied.
- No new storage key, schema, network endpoint, content, reward or database behavior is introduced.

Year 1 and Year 3 remain disabled. Existing Year 2 keys remain unchanged. Remote generative Tutor AI and automatic Quiz STT remain disabled.

## Synthetic regression matrix

| ID | Boundary | Automated evidence |
| --- | --- | --- |
| MJ-01 | logout/account replacement during manual read | delayed completion rejected; no projection write |
| MJ-02 | child A to B during manual read | old lease rejected |
| MJ-03 | child A to B to A | old epoch rejected |
| MJ-04 | local mutation after read begins | restore rejected; pending save retained |
| MJ-05 | child switch during realtime restore import | current-owner callback rejects restore |
| MJ-06 | pending resume/child tombstone during read | restore cannot revive deleted state |
| MJ-07 | Tutor reply pending during child switch | no stale bubble, announcement or persistence |
| MJ-08 | Tutor child A to B to A | first A request cannot commit |
| MJ-09 | Tutor pending across close/reopen | old response cannot alter reopened modal or draft |
| MJ-10 | unsupported Year 1/3 | existing fail-closed subject, resume and profile tests |
| MJ-11 | multi-child writes resolve out of order | unacknowledged mutation version remains dirty |
| MJ-12 | offline synthetic Year 2 | existing local-first Tutor and learning regressions |

Chrome acceptance with two synthetic children remains required. Automated tests and a QA artifact do not replace manual browser or physical-device evidence.

## Release constraints

Do not merge, tag, release or deploy from this branch. Keep physical-device and real-child acceptance on HOLD pending independent review and owner authorization.
