const crypto = require('crypto');
const digest = require('../digest');

const parseHeader = (header) => {
  const opts = {};
  for (const part of header.replace(/^Digest\s+/i, '').split(',')) {
    const m = /(\w+)=["']?([^'"]+)["']?/.exec(part);
    if (m) opts[m[1]] = m[2].replace(/["']/g, '');
  }
  return opts;
};

test('defaults to MD5 when the challenge omits algorithm (legacy Symo/Galvo behaviour)', () => {
  const header = digest('GET', '/api', 'Digest realm="Webinterface area", nonce="abc123", qop="auth"', 'service:pass');
  const parsed = parseHeader(header);
  expect(parsed.algorithm).toBe('MD5');
  expect(parsed.response).toHaveLength(32); // md5 hex digest length
});

test('uses SHA-256 when the challenge requests it, as sent by a GEN24 inverter', () => {
  const wwwAuthenticate = 'Digest algorithm="SHA256", qop="auth", realm="Webinterface area", nonce="53c45ab36a707cf9"';
  const header = digest('GET', '/api/commands/Login?user=technician', wwwAuthenticate, 'technician:pass');
  const parsed = parseHeader(header);

  expect(parsed.algorithm).toBe('SHA256');
  expect(parsed.response).toHaveLength(64); // sha256 hex digest length

  const ha1 = crypto.createHash('sha256').update('technician:Webinterface area:pass').digest('hex');
  const ha2 = crypto.createHash('sha256').update('GET:/api/commands/Login?user=technician').digest('hex');
  const expectedResponse = crypto.createHash('sha256')
    .update(`${ha1}:53c45ab36a707cf9:${parsed.nc}:${parsed.cnonce}:auth:${ha2}`)
    .digest('hex');

  expect(parsed.response).toBe(expectedResponse);
});

test('handles the SHA-256-sess variant', () => {
  const wwwAuthenticate = 'Digest algorithm="SHA-256-sess", qop="auth", realm="Webinterface area", nonce="n1"';
  const header = digest('GET', '/api', wwwAuthenticate, 'service:pass');
  const parsed = parseHeader(header);
  expect(parsed.algorithm).toBe('SHA-256-sess');
  expect(parsed.response).toHaveLength(64);
});

test('returns an empty string when the challenge is missing realm/nonce', () => {
  expect(digest('GET', '/api', 'Digest qop="auth"', 'service:pass')).toBe('');
});

test('includes opaque when present in the challenge', () => {
  const wwwAuthenticate = 'Digest realm="r", nonce="n", opaque="op123"';
  const header = digest('GET', '/api', wwwAuthenticate, 'service:pass');
  expect(parseHeader(header).opaque).toBe('op123');
});
