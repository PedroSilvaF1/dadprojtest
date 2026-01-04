<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Verify your email</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background-color:#0f0f0f;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0f0f0f;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background-color:#151515;border:1px solid #2a2a2a;border-radius:14px;">
            <tr>
              <td style="padding:28px 28px 12px 28px;text-align:center;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#f3f4f6;font-weight:700;">
                  {{ $appName }}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 0 28px;text-align:center;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:#f9fafb;font-weight:700;">
                  Verify your email
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0 32px;text-align:center;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#cbd5e1;line-height:1.5;">
                  Hi {{ $userName }}, thanks for signing up. Click the button below to verify your email and activate your account.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 12px 32px;text-align:center;">
                <a href="{{ $url }}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 20px;border-radius:10px;border-bottom:3px solid #991b1b;">
                  Verify Email
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 20px 32px;text-align:center;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9ca3af;line-height:1.4;">
                  If you did not create an account, you can safely ignore this email.
                </div>
              </td>
            </tr>
          </table>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#6b7280;margin-top:14px;">
            {{ $appName }} · This link expires per server settings
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
