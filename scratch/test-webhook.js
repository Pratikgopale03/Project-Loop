const http = require('http');

const data = JSON.stringify({
  content: "Zomato order delivery was delayed by 45 minutes and food arrived cold. Immediate refund requested.",
  customerLabel: "Rohan Sharma (@ZomatoVIP)",
  channel: "Zomato",
});

const req = http.request(
  {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/incoming',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    },
  },
  (res) => {
    let body = '';
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('RESPONSE:', body);
    });
  }
);

req.on('error', (e) => console.error('ERROR:', e.message));
req.write(data);
req.end();
