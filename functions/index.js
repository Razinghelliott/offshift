/**
 * OFFSHIFT — Cloud Functions
 *
 * Triggers an email to the OffShift team every time someone signs up
 * or submits a Founding Pro application. Uses Resend for delivery.
 *
 * Environment secrets required (set via `firebase functions:secrets:set`):
 *   - RESEND_API_KEY     The API key from resend.com
 *
 * Optional environment variables (set in functions/.env or via params):
 *   - NOTIFY_TO          Recipient email (defaults to elliottlambrecht@gmail.com)
 *   - NOTIFY_FROM        Sender email (defaults to onboarding@resend.dev)
 */

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const { Resend } = require("resend");

const RESEND_API_KEY = defineSecret("RESEND_API_KEY");
const NOTIFY_TO = defineString("NOTIFY_TO", { default: "elliottlambrecht@gmail.com" });
const NOTIFY_FROM = defineString("NOTIFY_FROM", { default: "OFFSHIFT <onboarding@resend.dev>" });

// Helpers — keep emails readable and safe
const escape = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const sourceLabel = (src) => {
  switch (src) {
    case "index_strip":  return "Homepage signup strip";
    case "index_notify": return "Notify Me (mobile-app early access)";
    case "index_apply":  return "Founding Pro application";
    default:             return src || "Unknown source";
  }
};

// ─── Trigger: new signup row ───
exports.notifyOnSignup = onDocumentCreated(
  {
    document: "signups/{docId}",
    secrets: [RESEND_API_KEY],
    region: "us-east1"
  },
  async (event) => {
    const data = event.data && event.data.data();
    if (!data) return;

    const resend = new Resend(RESEND_API_KEY.value());
    const role = data.role === "pro" ? "Founding Pro" : "Booker / Host";
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();

    const subject = `[OFFSHIFT] New ${role} signup — ${data.email}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222;">
        <h2 style="margin:0 0 6px;font-size:20px;color:#c8102e;">New ${escape(role)} Signup</h2>
        <p style="color:#666;margin:0 0 20px;font-size:13px;">${escape(sourceLabel(data.source))}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#666;width:120px;">Email</td><td style="padding:8px 0;font-weight:600;">${escape(data.email)}</td></tr>
          ${name ? `<tr><td style="padding:8px 0;color:#666;">Name</td><td style="padding:8px 0;">${escape(name)}</td></tr>` : ""}
          ${data.phone ? `<tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${escape(data.phone)}</td></tr>` : ""}
          ${data.craft ? `<tr><td style="padding:8px 0;color:#666;">Craft</td><td style="padding:8px 0;">${escape(data.craft)}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#666;">Role</td><td style="padding:8px 0;">${escape(role)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Source</td><td style="padding:8px 0;">${escape(data.source || "")}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="font-size:13px;color:#888;">
          <a href="https://console.firebase.google.com/project/offshift-charleston/firestore/data/~2Fsignups~2F${escape(event.params.docId)}" style="color:#c8102e;text-decoration:none;">View in Firestore →</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: NOTIFY_FROM.value(),
        to: NOTIFY_TO.value(),
        subject,
        html
      });
    } catch (err) {
      console.error("notifyOnSignup: failed to send email", err);
      throw err;
    }
  }
);

// ─── Trigger: new Founding Pro application ───
exports.notifyOnApplication = onDocumentCreated(
  {
    document: "proApplications/{docId}",
    secrets: [RESEND_API_KEY],
    region: "us-east1"
  },
  async (event) => {
    const data = event.data && event.data.data();
    if (!data) return;

    const resend = new Resend(RESEND_API_KEY.value());
    const name = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
    const cats = Array.isArray(data.categories) ? data.categories.join(", ") : "(none)";

    const subject = `[OFFSHIFT] Founding Pro application — ${name || data.email}`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#222;">
        <h2 style="margin:0 0 6px;font-size:22px;color:#c8102e;">New Founding Pro Application</h2>
        <p style="color:#666;margin:0 0 20px;font-size:13px;">Submitted from the homepage application form.</p>

        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#666;width:140px;">Name</td><td style="padding:8px 0;font-weight:600;">${escape(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Email</td><td style="padding:8px 0;">${escape(data.email)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Phone</td><td style="padding:8px 0;">${escape(data.phone)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Craft</td><td style="padding:8px 0;font-weight:600;">${escape(data.craft)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Categories</td><td style="padding:8px 0;">${escape(cats)}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Location</td><td style="padding:8px 0;">${escape(data.location)}</td></tr>
          ${data.links ? `<tr><td style="padding:8px 0;color:#666;">Links</td><td style="padding:8px 0;"><a href="${escape(data.links)}" style="color:#c8102e;">${escape(data.links)}</a></td></tr>` : ""}
        </table>

        <h3 style="margin:24px 0 8px;font-size:15px;color:#444;">Headline</h3>
        <p style="margin:0;padding:12px 14px;background:#f7f7f7;border-left:3px solid #c8102e;font-style:italic;">"${escape(data.headline)}"</p>

        <h3 style="margin:24px 0 8px;font-size:15px;color:#444;">Bio</h3>
        <p style="margin:0;padding:12px 14px;background:#f7f7f7;border-left:3px solid #c8102e;line-height:1.6;">${escape(data.bio).replace(/\n/g, "<br>")}</p>

        <hr style="border:none;border-top:1px solid #eee;margin:28px 0 16px;">
        <p style="font-size:13px;color:#888;">
          <a href="https://console.firebase.google.com/project/offshift-charleston/firestore/data/~2FproApplications~2F${escape(event.params.docId)}" style="color:#c8102e;text-decoration:none;">View full application in Firestore →</a>
        </p>
      </div>
    `;

    try {
      await resend.emails.send({
        from: NOTIFY_FROM.value(),
        to: NOTIFY_TO.value(),
        subject,
        html
      });
    } catch (err) {
      console.error("notifyOnApplication: failed to send email", err);
      throw err;
    }
  }
);
