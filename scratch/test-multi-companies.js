const http = require('http');

const reviews = [
  {
    content: "Delivery executive took 50 minutes and the order was missing drinks. Unacceptable service.",
    customerLabel: "Amit Patel (@SwiggyGold)",
    channel: "Swiggy",
  },
  {
    content: "Driver canceled the ride after making me wait 20 minutes in heavy rain. Horrible experience.",
    customerLabel: "Priya Sharma (@UberUser)",
    channel: "Uber",
  },
  {
    content: "Package arrived with damaged outer seal and my instant return request was rejected by support.",
    customerLabel: "Rahul Verma (@AmazonPrime)",
    channel: "Amazon",
  },
  {
    content: "Received wrong item model for my electronics order and refund processing is stuck.",
    customerLabel: "Sneha Reddy (@FlipkartPlus)",
    channel: "Flipkart",
  },
  {
    content: "iOS app keeps crashing immediately upon opening after updating to v18.2. Urgent bug fix needed.",
    customerLabel: "Dave (@LinearDev)",
    channel: "App Store",
  },
];

async function sendReview(reviewData) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(reviewData);
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
        res.on('end', () => resolve(JSON.parse(body)));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runAll() {
  console.log("Sending live multi-company webhook reviews...");
  for (const item of reviews) {
    try {
      const res = await sendReview(item);
      console.log(`[${item.channel}] -> SUCCESS:`, res.feedbackId, "| Sentiment:", res.sentiment);
    } catch (e) {
      console.error(`[${item.channel}] -> ERROR:`, e.message);
    }
  }
  console.log("All multi-company reviews ingested!");
}

runAll();
