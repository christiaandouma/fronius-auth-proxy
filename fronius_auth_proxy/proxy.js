const express = require('express');
const { makeRequest } = require('./makeRequest');

const ts = () => new Date().toISOString();
const log = (...a) => console.log(ts(), ...a);
const err = (...a) => console.error(ts(), ...a);

const app = express();
const port = 3000;

app.use(express.json());

app.all('/request', async (req, res) => {
  log('Requested Route:', req.path);
  log(req.body);
  try {
    log(req.method);
    const requestData = {
      protocol: req.protocol,
      options: {
        hostname: req.query.hostname || process.env.FRONIUS_HOSTNAME,
        port: req.query.port || process.env.FRONIUS_PORT || 80,
        path: req.query.path,
        method: req.method,
      },
      body: JSON.stringify(req.body),
      username: req.query.username || process.env.FRONIUS_USERNAME,
      password: req.query.password || process.env.FRONIUS_PASSWORD,
    };

    const request_result = await makeRequest(requestData);
    res = request_result;
  } catch (error) {
    err('Error:', error);
    res.status(500).json({ error: 'An error occurred while making the request.' });
  }
});

app.listen(port, () => {
  log(`Server is running on port ${port}`);
});
