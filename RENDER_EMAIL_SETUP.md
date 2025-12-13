# Email Configuration Guide (Gmail or Brevo)

This guide explains how to configure email for your Render deployment. You can use either **Gmail** or **Brevo** (formerly Sendinblue).

## Option A: Using Brevo (Recommended if you already have it)
If you are already using Brevo for OTPs, you **do not** need to add Gmail credentials. You just need to make sure the **Host** is set correctly, otherwise the server tries to connect to Gmail by default.

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Go to **Environment** variables.
3.  Ensure you have these set:

| Key | Value |
| :--- | :--- |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | *Your Brevo Login Email* |
| `SMTP_PASS` | *Your Brevo SMTP Key (Master Password)* |

> [!NOTE]
> For Brevo, `SMTP_SECURE` should usually be `false` when using port 587.

## Option B: Using Gmail
If you prefer to use a personal Gmail account:

### 1. Generate a Gmail App Password
1.  Go to your [Google Account Settings](https://myaccount.google.com/).
2.  Select **Security** > **2-Step Verification** (Turn ON).
3.  Search for and select **App passwords**.
4.  Create a new one named "GymApp" and copy the 16-character code.

### 2. Configure Render
Add these variables in Render:

| Key | Value |
| :--- | :--- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |
| `EMAIL_USER` | *Your Gmail Address* |
| `EMAIL_PASS` | *Your 16-char App Password* |
| `ADMIN_EMAIL` | *Email address to receive feedback (e.g. your personal email)* |

## Verification
1.  Save changes in Render and wait for redeployment.
2.  Check Logs for: `[Email] Configured with user: ...`
3.  Test by sending Feedback or an OTP.
