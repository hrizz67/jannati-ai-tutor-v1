# P2.6-F — Owner-only physical iPhone/Android testing over trusted Wi-Fi

This procedure uses an **isolated, immutable backend-disabled QA artifact**.
It **never** requires a production tag/deploy, real learner login, Supabase,
STT Worker, child audio or paid access. Use invented tester data only.

## 1. Obtain exact reviewed QA artifact

After the controlled accessibility merge reaches `main`, open the GitHub
Actions run called **Owner-only device QA artifact (NO DEPLOY)** and download
the `jannati-owner-device-qa-<40-char-SHA>` ZIP. Its contents expire after
7 days. Note the 40-char SHA shown in the run, and make sure CI says SUCCESS.

The artifact contains `qa-preview-manifest.json`, `_headers`,
`_redirects` and `jannati-ai-tutor-v1/index.html` with assets. It has
no production credentials. It is **not** a hosted website; do not paste
the GitHub artifact URL into the phone browser.

## 2. Prepare a separate working folder on your Windows laptop

Use a **new isolated git worktree** so the current Codex/development changes
are not lost. In PowerShell, inside your existing Jannati repository:

```powershell
git fetch origin main
git worktree add --detach C:\jannati-device-qa <EXACT_40_CHARACTER_SHA_FROM_ACTIONS>
```

Replace the placeholder with the reviewed artifact SHA. Do not type the
angle brackets literally. If the worktree already exists, inspect it
instead of overwriting it.

Extract the downloaded ZIP so the first level goes directly into
`C:\jannati-device-qa\qa-preview-site\`. For example:

```powershell
Expand-Archive -Path "$env:USERPROFILE\Downloads\<ARTIFACT_ZIP_NAME>.zip" -DestinationPath "C:\jannati-device-qa\qa-preview-site" -Force
cd C:\jannati-device-qa
node scripts/preview/serveQaOnLan.mjs
```

Replace the ZIP name with the actual file you downloaded. Node.js 24
is recommended. The server **refuses to start** if the ZIP SHA differs
from the checked-out Git SHA or its manifest does not explicitly disable
Supabase/STT/cloud writes/QA exact-ID harnesses.

## 3. Connect the real phone to the same trusted private Wi-Fi

The script prints **Phone URL: http://<LAN-IP>:4173/jannati-ai-tutor-v1/**.
Open that exact printed address in iPhone Safari or Android Chrome.
Use **only a trusted home/local Wi-Fi**, with no router port forwarding.
If Windows Firewall prompts, allow Node on **Private networks only**.
The server is an unauthenticated local HTTP fixture: never use it for
real student accounts, sensitive conversations or microphones, and stop
it with **Ctrl+C** immediately after the test.

HTTP LAN staging is deliberately not a secure HTTPS origin. Web Speech,
STT, service-worker/PWA installation, platform APIs that require HTTPS
and cloud features are **outside scope**. Do not turn them on to make
the fixture behave more like production.

## 4. Physical acceptance

Use `docs/P26F4_PHYSICAL_ACCESSIBILITY_ACCEPTANCE.md`. Record:
- exact tested SHA, device model/OS/browser, date/time and test ID;
- portrait, landscape, *native* browser zoom/text setting, input type;
- visible focus order, transcript scrolling, button reachability,
  VoiceOver/TalkBack spoken language, announcements, clipping;
- PASS/FAIL/BLOCKED with sanitized evidence only, no real child identifiers.

In particular: iPhone VoiceOver, Android TalkBack and native Chrome
200%/400% zoom **must be run by a human on those devices**; CDP emulated
root font 200% is not a substitute. Mark any missing evidence NOT RUN,
not PASS. If a failure occurs, note the exact reproduction and retain
NO-GO for student access until remedied.

## 5. Cleanup

Use Ctrl+C to stop the LAN server. Remove/expire the QA ZIP and preview
folder after the owner-only test. Use `git worktree remove
C:\jannati-device-qa` from the original repo when done and when no
changes in the worktree need to be retained. Do not delete production
browser storage or alter production access settings.

**Production release stays HOLD** until the owner explicitly accepts
the physical QA evidence; there is no automatic release/tag/deploy in
the artifact workflow.
