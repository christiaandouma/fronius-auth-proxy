const express = require('express');
const { makeRequest } = require('./makeRequest');
const { log, err } = require('./logger');

const app = express();
const PORT = 3000;

app.use(express.json());

app.all('/request', async (req, res) => {
  log(req.method, req.path, req.body);
  try {
    const useHttps = (req.query.https ?? process.env.FRONIUS_HTTPS) === 'true';
    const rejectUnauthorized = (req.query.rejectUnauthorized ?? process.env.FRONIUS_REJECT_UNAUTHORIZED) === 'true';
    const result = await makeRequest({
      options: {
        hostname: req.query.hostname || process.env.FRONIUS_HOSTNAME,
        port: Number(req.query.port || process.env.FRONIUS_PORT || (useHttps ? 443 : 80)),
        path: req.query.path,
        method: req.method,
        https: useHttps,
        rejectUnauthorized,
      },
      body: Object.keys(req.body).length ? JSON.stringify(req.body) : undefined,
      username: req.query.username || process.env.FRONIUS_USERNAME,
      password: req.query.password || process.env.FRONIUS_PASSWORD,
    });
    res.status(result.statusCode).send(result.body);
  } catch (error) {
    err('Error:', error);
    res.status(500).json({ error: 'An error occurred while making the request.' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => log(`Server is running on port ${PORT}`));
}

module.exports = app;
