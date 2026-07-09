const https = require('https');
const config = require('../../config/email.config');

function sendWithBrevo(payload) {
  return new Promise((resolve, reject) => {
    if (!config.brevo.apiKey) {
      reject(new Error('BREVO_API_KEY is not configured'));
      return;
    }

    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'api.brevo.com',
        port: 443,
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'api-key': config.brevo.apiKey,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                  const parsed = data ? JSON.parse(data) : {};
                  console.log('Brevo response:', parsed);
                  resolve(parsed);
                } catch (e) {
                  console.log('Brevo response (non-json):', data);
                  resolve(data);
                }
          } else {
                console.warn('Brevo API error', res.statusCode, data);
                reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { sendWithBrevo };
