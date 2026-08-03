jest.mock('../makeRequest');

const request = require('supertest');
const app = require('../proxy');
const { makeRequest } = require('../makeRequest');

beforeEach(() => jest.clearAllMocks());

test('forwards inverter status and body to client', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '{"ok":true}' });
  const res = await request(app)
    .post('/request?hostname=192.168.1.1&path=/config/test&username=service&password=pass')
    .send({ key: 'value' });
  expect(res.status).toBe(200);
  expect(res.text).toBe('{"ok":true}');
});

test('passes query params to makeRequest', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app)
    .post('/request?hostname=10.0.0.1&port=8080&path=/api&username=admin&password=secret')
    .send({ x: 1 });
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ hostname: '10.0.0.1', port: 8080, path: '/api' }),
    username: 'admin',
    password: 'secret',
    body: '{"x":1}',
  }));
});

test('falls back to env vars when query params are absent', async () => {
  process.env.FRONIUS_HOSTNAME = 'env-host';
  process.env.FRONIUS_USERNAME = 'env-user';
  process.env.FRONIUS_PASSWORD = 'env-pass';
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app).get('/request?path=/api');
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ hostname: 'env-host' }),
    username: 'env-user',
    password: 'env-pass',
  }));
  delete process.env.FRONIUS_HOSTNAME;
  delete process.env.FRONIUS_USERNAME;
  delete process.env.FRONIUS_PASSWORD;
});

test('returns 500 when makeRequest throws', async () => {
  makeRequest.mockRejectedValue(new Error('Connection refused'));
  const res = await request(app).get('/request?path=/api');
  expect(res.status).toBe(500);
  expect(res.body).toHaveProperty('error');
});

test('omits body for requests with empty JSON object', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app).get('/request?path=/api');
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({ body: undefined }));
});

test('enables https and defaults the port to 443 when https=true', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app).get('/request?hostname=192.168.1.1&path=/api&https=true');
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ port: 443, https: true, rejectUnauthorized: false }),
  }));
});

test('passes rejectUnauthorized=true through when requested', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app).get('/request?hostname=192.168.1.1&path=/api&https=true&rejectUnauthorized=true');
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ rejectUnauthorized: true }),
  }));
});

test('defaults to http on port 80 when https is not set', async () => {
  makeRequest.mockResolvedValue({ statusCode: 200, body: '' });
  await request(app).get('/request?hostname=192.168.1.1&path=/api');
  expect(makeRequest).toHaveBeenCalledWith(expect.objectContaining({
    options: expect.objectContaining({ port: 80, https: false }),
  }));
});
