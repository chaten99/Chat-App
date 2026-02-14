export const otpTemplate = (otp, name = "User") => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Quick Chat OTP</title>
  </head>
  <body style="margin:0;padding:0;background-color:#0b141a;font-family:Arial,Helvetica,sans-serif;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;background:#0b141a;">
      <tr>
        <td align="center">
          
          <!-- Card -->
          <table width="100%" max-width="500" cellpadding="0" cellspacing="0"
            style="background:#111b21;border-radius:16px;padding:40px 30px;box-shadow:0 10px 30px rgba(0,0,0,0.4);">
            
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <h1 style="color:#00a884;margin:0;font-size:28px;">
                  🚀 Quick Chat
                </h1>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom:10px;">
                <h2 style="color:#ffffff;margin:0;font-weight:600;">
                  Verify Your Account
                </h2>
              </td>
            </tr>

            <!-- Greeting -->
            <tr>
              <td align="center" style="padding:10px 0 25px 0;">
                <p style="color:#9aa5b1;margin:0;font-size:14px;">
                  Hi <strong style="color:#ffffff;">${name}</strong>,  
                  use the OTP below to continue.
                </p>
              </td>
            </tr>

            <!-- OTP Box -->
            <tr>
              <td align="center" style="padding-bottom:25px;">
                <div style="
                  display:inline-block;
                  background:#0b141a;
                  border:2px dashed #00a884;
                  border-radius:12px;
                  padding:18px 28px;
                  letter-spacing:8px;
                  font-size:32px;
                  font-weight:bold;
                  color:#00a884;
                ">
                  ${otp}
                </div>
              </td>
            </tr>

            <!-- Expiry -->
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <p style="color:#9aa5b1;margin:0;font-size:13px;">
                  ⏱ This OTP expires in <strong>10 minutes</strong>.
                </p>
              </td>
            </tr>

            <!-- Warning -->
            <tr>
              <td align="center" style="padding-bottom:25px;">
                <p style="color:#6b7280;margin:0;font-size:12px;line-height:1.6;">
                  If you didn't request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="border-top:1px solid #202c33;padding-top:20px;">
                <p style="color:#6b7280;margin:0;font-size:11px;">
                  © ${new Date().getFullYear()} Quick Chat • Secure Messaging
                </p>
              </td>
            </tr>

          </table>
          <!-- End Card -->

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
