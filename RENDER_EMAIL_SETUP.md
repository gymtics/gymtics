# Gmail & Render Email Configuration Guide

This guide explains how to fix the "Email skipped" or "Feedback not sent" issues on your live Render deployment.

## 1. Why is it failing?
Google does not allow you to use your regular Gmail password for third-party apps like this server. You **must** generate a special "App Password".

## 2. Generate a Gmail App Password
1.  Go to your [Google Account Settings](https://myaccount.google.com/).
2.  Select **Security** on the left.
3.  Under "Signing in to Google", select **2-Step Verification** (Turn it ON if it's off).
4.  Once 2-Step Verification is ON, look for **App passwords** (You might need to search for "App passwords" in the search bar at the top).
5.  **Create a new App Password**:
    *   **App name**: Enter "GymApp Render"
    *   Click **Create**.
6.  **Copy the 16-character password** shown (it will look like `xxxx xxxx xxxx xxxx`).

> [!IMPORTANT]
> This is the password you will use in Render. Do NOT use your normal Gmail login password.

## 3. Configure Render
1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Select your **Web Service**.
3.  Click on **Environment** in the side menu.
4.  Add the following **Environment Variables**:

| Key | Value |
| :--- | :--- |
| `EMAIL_USER` | `gymtics0@gmail.com` |
| `EMAIL_PASS` | `paste-your-16-char-app-password-here` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_SECURE` | `true` |

5.  Click **Save Changes**.
6.  Render will automatically redeploy your service.

## 4. Verification
1.  Wait for the deployment to finish.
2.  Check the **Logs** tab in Render.
3.  You should see:
    ```
    [Email] Configured with user: gymtics0@gmail.com
    [Email] Server is ready to take our messages
    ```
4.  Go to your live app and submit a feedback form.
5.  Check the inbox of `gymtics0@gmail.com`.
