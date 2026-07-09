const { escapeHtml } = require('../../utils/email.utils');

function buildEmailLayout({ title, previewText, content, footerText = 'Thanks for choosing StyleHub.' }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,sans-serif;color:#111827;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:24px 32px;color:#ffffff;">
                    <h1 style="margin:0;font-size:24px;">StyleHub</h1>
                    <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">${escapeHtml(previewText || title)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    ${content}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;color:#64748b;font-size:13px;line-height:1.5;">
                    ${escapeHtml(footerText)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

module.exports = { buildEmailLayout };
