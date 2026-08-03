const crypto = require('crypto');

const AUTH_KEY_VALUE_RE = /(\w+)=["']?([^'"]{1,10000})["']?/;
const NC_PAD = '00000000';
let nonceCount = 0;

const hash = (algorithm, text) => crypto.createHash(algorithm).update(text).digest('hex');

// Builds an RFC 7616 Digest Authorization header from a WWW-Authenticate challenge.
// Supports MD5 (RFC 2617, used by older Fronius inverters) and SHA-256 (used by
// GEN24/Primo), including their "-sess" variants.
const digestAuthHeader = (method, uri, wwwAuthenticate, userpass) => {
  const parts = wwwAuthenticate.replace(/^Digest\s+/i, '').split(',');
  const opts = {};
  for (const part of parts) {
    const m = AUTH_KEY_VALUE_RE.exec(part);
    if (m) opts[m[1]] = m[2].replace(/["']/g, '');
  }

  if (!opts.realm || !opts.nonce) return '';

  const algorithm = (opts.algorithm || 'MD5').toUpperCase();
  const isSess = algorithm.endsWith('-SESS');
  const hashAlgo = algorithm.startsWith('SHA-256') || algorithm.startsWith('SHA256') ? 'sha256' : 'md5';

  const [username, password] = userpass.split(':');

  let nc = String(++nonceCount);
  nc = NC_PAD.substring(nc.length) + nc;
  const cnonce = crypto.randomBytes(8).toString('hex');

  let ha1 = hash(hashAlgo, `${username}:${opts.realm}:${password}`);
  if (isSess) ha1 = hash(hashAlgo, `${ha1}:${opts.nonce}:${cnonce}`);
  const ha2 = hash(hashAlgo, `${method.toUpperCase()}:${uri}`);

  let qop = opts.qop || '';
  let s = `${ha1}:${opts.nonce}`;
  if (qop) {
    qop = qop.split(',')[0].trim();
    s += `:${nc}:${cnonce}:${qop}`;
  }
  s += `:${ha2}`;
  const response = hash(hashAlgo, s);

  let authstring = `Digest username="${username}", realm="${opts.realm}", nonce="${opts.nonce}", uri="${uri}", response="${response}"`;
  if (opts.opaque) authstring += `, opaque="${opts.opaque}"`;
  if (qop) authstring += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  authstring += `, algorithm=${opts.algorithm || 'MD5'}`;
  return authstring;
};

module.exports = digestAuthHeader;
