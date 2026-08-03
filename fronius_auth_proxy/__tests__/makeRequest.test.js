jest.mock('http');
jest.mock('https');
jest.mock('digest-header');

const http = require('http');
const https = require('https');
const digest = require('digest-header');
const { makeRequest } = require('../makeRequest');

const mockHttp = (responses, transport = http) => {
  let call = 0;
  transport.request.mockImplementation((_, callback) => {
    const resp = responses[call++];
    const mockRes = {
      statusCode: resp.statusCode,
      headers: resp.headers || {},
      on: (event, handler) => {
        if (event === 'data') handler(resp.body || '');
        if (event === 'end') handler();
      },
    };
    callback(mockRes);
    return { on: jest.fn(), end: jest.fn(), write: jest.fn() };
  });
};

beforeEach(() => jest.clearAllMocks());

test('makes two requests and returns the authenticated response', async () => {
  mockHttp([
    { statusCode: 401, headers: { 'x-www-authenticate': 'Digest realm="test"' }, body: '' },
    { statusCode: 200, headers: {}, body: '{"result":"ok"}' },
  ]);
  digest.mockReturnValue('Digest username="service",...');

  const result = await makeRequest({
    options: { hostname: '192.168.1.1', port: 80, path: '/api', method: 'GET' },
    username: 'service',
    password: 'pass',
  });

  expect(http.request).toHaveBeenCalledTimes(2);
  expect(digest).toHaveBeenCalledWith('GET', '/api', 'Digest realm="test"', 'service:pass');
  expect(result.statusCode).toBe(200);
  expect(result.body).toBe('{"result":"ok"}');
});

test('sets Authorization header on second request', async () => {
  mockHttp([
    { statusCode: 401, headers: { 'x-www-authenticate': 'Digest realm="test"' }, body: '' },
    { statusCode: 200, headers: {}, body: '' },
  ]);
  digest.mockReturnValue('Digest token="abc"');

  await makeRequest({
    options: { hostname: '192.168.1.1', port: 80, path: '/api', method: 'GET' },
    username: 'service',
    password: 'pass',
  });

  const secondOptions = http.request.mock.calls[1][0];
  expect(secondOptions.headers['Authorization']).toBe('Digest token="abc"');
});

test('includes Content-Length when body is provided', async () => {
  mockHttp([
    { statusCode: 401, headers: { 'x-www-authenticate': 'Digest realm="test"' }, body: '' },
    { statusCode: 200, headers: {}, body: '' },
  ]);
  digest.mockReturnValue('Digest ...');

  const body = '{"key":"value"}';
  await makeRequest({
    options: { hostname: '192.168.1.1', port: 80, path: '/api', method: 'POST' },
    username: 'service',
    password: 'pass',
    body,
  });

  const secondOptions = http.request.mock.calls[1][0];
  expect(secondOptions.headers['Content-Length']).toBe(Buffer.byteLength(body));
});

test('rejects when http.request errors', async () => {
  http.request.mockImplementation(() => {
    const mockReq = { on: jest.fn(), end: jest.fn(), write: jest.fn() };
    mockReq.on.mockImplementation((event, handler) => {
      if (event === 'error') handler(new Error('ECONNREFUSED'));
    });
    return mockReq;
  });

  await expect(makeRequest({
    options: { hostname: '192.168.1.1', port: 80, path: '/api', method: 'GET' },
    username: 'service',
    password: 'pass',
  })).rejects.toThrow('ECONNREFUSED');
});

test('uses the https module when options.https is true', async () => {
  mockHttp([
    { statusCode: 401, headers: { 'x-www-authenticate': 'Digest realm="test"' }, body: '' },
    { statusCode: 200, headers: {}, body: '{"result":"ok"}' },
  ], https);
  digest.mockReturnValue('Digest username="service",...');

  const result = await makeRequest({
    options: { hostname: '192.168.1.1', port: 443, path: '/api', method: 'GET', https: true, rejectUnauthorized: false },
    username: 'service',
    password: 'pass',
  });

  expect(https.request).toHaveBeenCalledTimes(2);
  expect(http.request).not.toHaveBeenCalled();
  expect(result.statusCode).toBe(200);
});

test('passes rejectUnauthorized through to the https request options', async () => {
  mockHttp([
    { statusCode: 401, headers: { 'x-www-authenticate': 'Digest realm="test"' }, body: '' },
    { statusCode: 200, headers: {}, body: '' },
  ], https);
  digest.mockReturnValue('Digest token="abc"');

  await makeRequest({
    options: { hostname: '192.168.1.1', port: 443, path: '/api', method: 'GET', https: true, rejectUnauthorized: false },
    username: 'service',
    password: 'pass',
  });

  const secondOptions = https.request.mock.calls[1][0];
  expect(secondOptions.rejectUnauthorized).toBe(false);
});
