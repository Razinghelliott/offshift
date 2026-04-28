# OFFSHIFT — Cloud Functions

Notification emails for OffShift signups. Triggers automatically every time someone submits one of the homepage forms.

## What it does

- **`notifyOnSignup`** — fires when a new doc lands in the `signups` collection. Sends an email with email, name, role, phone, source.
- **`notifyOnApplication`** — fires when a new doc lands in `proApplications`. Sends a full application detail email.

Both go to `elliottlambrecht@gmail.com` by default. Configurable via `NOTIFY_TO` env var.

## One-time setup

You'll do this once. Estimated time: 15-20 minutes.

### 1. Upgrade Firebase to the Blaze plan

Cloud Functions require the pay-as-you-go (Blaze) plan. **It's still effectively free** for your volume — the free tier covers 2 million function invocations and 5 GB of network traffic per month, well above what you'd hit with handfuls of signups per day.

- Go to **[Firebase Console → Settings → Usage and billing](https://console.firebase.google.com/project/offshift-charleston/usage/details)**
- Click **Modify plan** → choose **Blaze**
- Add a credit card. **Optional but recommended:** set a budget alert at $5/month so you'd get an email before any unexpected charges.

### 2. Sign up for Resend (the email service)

- Go to **[resend.com](https://resend.com)** → sign up (free)
- Free tier: 100 emails/day, 3,000/month. More than enough for early signups.
- Once signed in, go to **API Keys** → **Create API Key** → name it "OffShift Functions" → copy the key (starts with `re_`)

### 3. Install Firebase CLI (if you don't have it)

In Terminal:
```bash
npm install -g firebase-tools
```

If you get a permissions error, prefix with `sudo` or use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions.

### 4. Log in to Firebase from the CLI

```bash
firebase login
```

A browser tab opens — sign in with the Google account that owns the offshift-charleston project.

### 5. Install the function's dependencies

From the repo root:
```bash
cd ~/offshift/functions
npm install
cd ..
```

This pulls down `firebase-functions`, `firebase-admin`, and `resend`. Takes about a minute.

### 6. Save the Resend API key as a secret

```bash
firebase functions:secrets:set RESEND_API_KEY
```

It will prompt you to paste the API key from step 2. The secret is stored encrypted in Google Secret Manager — never committed to git.

### 7. Deploy

```bash
firebase deploy --only functions
```

First deploy takes 2-4 minutes. You should see two functions show up in green:
```
✔  functions[notifyOnSignup(us-east1)] Successful create operation.
✔  functions[notifyOnApplication(us-east1)] Successful create operation.
```

### 8. Test

Open your live homepage, fill out any one of the three forms, and submit. Within ~30 seconds you should get an email at `elliottlambrecht@gmail.com`. If it doesn't arrive:

```bash
firebase functions:log
```

This shows the function logs. Look for errors near your test submission.

## Day-to-day operations

Once set up, you don't need to touch the CLI. Cloud Functions auto-scale and run on demand. Logs are visible at [console.firebase.google.com/project/offshift-charleston/functions/logs](https://console.firebase.google.com/project/offshift-charleston/functions/logs).

## Changing the notification recipient

To change where emails go, edit the `NOTIFY_TO` parameter in `functions/index.js`:
```js
const NOTIFY_TO = defineString("NOTIFY_TO", { default: "your-new-email@example.com" });
```
Then redeploy: `firebase deploy --only functions`.

## Sending from your own domain

By default emails come from `onboarding@resend.dev`. To send from `hello@offshiftcharleston.com` (which feels more professional and doesn't get filtered):

1. In Resend dashboard → **Domains** → **Add Domain** → enter `offshiftcharleston.com`
2. Add the DNS records Resend gives you to your domain registrar (3-4 records)
3. Wait for verification (can take an hour)
4. Update `NOTIFY_FROM` in `functions/index.js` to `"OFFSHIFT <hello@offshiftcharleston.com>"`
5. Redeploy

## Costs

For your expected volume (handfuls of signups per day):
- **Cloud Functions:** $0/month (well under free tier)
- **Resend:** $0/month (well under free tier of 3,000/month)
- **Firestore:** $0/month (well under free tier)

Total: $0/month. The Blaze plan is required to enable Functions, but billing only kicks in if you exceed the free tier. The budget alert at $5 is your safety net.

## Files in this directory

- `index.js` — function code (the triggers + email templates)
- `package.json` — dependencies
- `.gitignore` — excludes `node_modules` and secrets from git
- `README.md` — this file
