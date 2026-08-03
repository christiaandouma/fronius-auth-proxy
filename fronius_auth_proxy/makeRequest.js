const http = require('http');
const https = require('https');
const digest = require('./digest');
const { log } = require('./logger');

const httpRequest = (options, body) => new Promise((resolve, reject) => {
  const transport = options.https ? https : http;
  const req = transport.request(options, res => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
  });
  req.on('error', reject);
  if (body) req.write(body);
  req.end();
});

const makeRequest = async ({ options, username, password, body }) => {
  // First request to obtain the digest challenge (expected to fail with 401)
  const challenge = await httpRequest(options);
  const auth = digest(options.method, options.path, challenge.headers['x-www-authenticate'], `${username}:${password}`);
  log('Auth header computed');

  const authOptions = {
    ...options,
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Authorization': auth,
      ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
    },
  };

  const result = await httpRequest(authOptions, body);
  log('Response:', result.statusCode, result.body);
  return result;
};

module.exports = { makeRequest };
