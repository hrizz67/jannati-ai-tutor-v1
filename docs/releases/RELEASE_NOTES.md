# Jannati AI Tutor 3.13.22 — Manual Premium Sales Readiness

Status: stable
Tag: v3.13.22
Build date: 2026-10-11T05:33:32.415Z

## Release Readiness

- The manual Premium upgrade and renewal page now supports 30, 90, and 365-day plans.
- Plan prices are RM10, RM25, and RM100 respectively.
- Customers can review their account identity, follow DuitNow or bank-transfer instructions, and contact Admin through the configured WhatsApp-assisted sales flow.
- Bank account details are supplied privately through WhatsApp and are not stored in the public repository.

## Commercial Safety

- Admin manually verifies a real payment before using the existing Admin Console to activate or renew Premium.
- Premium access remains server-authoritative; the customer page cannot mark a payment PAID or mutate entitlement.
- This release adds no payment gateway, automatic payment activation, or customer-side PAID trust.
- This release includes no database migration or schema/RPC change.

## Content Quality

- P1.13 cloud sync and reward behavior are unchanged.
- Voice and STT behavior are unchanged.
- The question bank is unchanged.
- All eight Year 2 subjects remain covered by the release validation scope.

## Validation Summary

- Status: pass
- Info: 14816
- Warnings: 0
- Errors: 0

## Curriculum Coverage

- Subjects: 8
- Topics: 84
- Questions: 4530
- Unique SK/SP pairs: 453
- Curriculum coverage: 100%
- Difficulty balance: mudah 2086, sederhana 1753, sukar 691

## Known Follow-ups

- Large JavaScript chunks remain a performance improvement target.
- Real-device Safari, microphone, audio, RTL, and accessibility checks remain part of manual acceptance.
