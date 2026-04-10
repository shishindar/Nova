const crypto = require('crypto');

const COOKIE_NAME = 'smartbuspass_session';
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function parseCookies(header = '') {
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf('=');
      if (index === -1) return acc;
      const key = decodeURIComponent(part.slice(0, index));
      const value = decodeURIComponent(part.slice(index + 1));
      acc[key] = value;
      return acc;
    }, {});
}

function serializeCookie(name, value, options = {}) {
  const parts = [`${encodeURIComponent(name)}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge / 1000)}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push('Secure');

  return parts.join('; ');
}

function decodeSession(rawCookie, secret) {
  if (!rawCookie) return {};

  const [payload, signature] = rawCookie.split('.');
  if (!payload || !signature) return {};
  if (sign(payload, secret) !== signature) return {};

  try {
    return JSON.parse(base64UrlDecode(payload));
  } catch {
    return {};
  }
}

function encodeSession(session, secret) {
  const payload = base64UrlEncode(JSON.stringify(session));
  return `${payload}.${sign(payload, secret)}`;
}

function hasSessionContent(session) {
  return Object.keys(session).length > 0;
}

function sessionMiddleware(req, res, next) {
  const secret = process.env.SESSION_SECRET || 'smartbuspass_secret';
  const cookies = parseCookies(req.headers.cookie);

  let destroyed = false;
  let dirty = false;

  const sessionData = decodeSession(cookies[COOKIE_NAME], secret);
  const session = new Proxy(sessionData, {
    set(target, prop, value) {
      dirty = true;
      target[prop] = value;
      return true;
    },
    deleteProperty(target, prop) {
      dirty = true;
      delete target[prop];
      return true;
    }
  });

  Object.defineProperty(session, 'destroy', {
    enumerable: false,
    value: (callback) => {
      destroyed = true;
      dirty = false;
      Object.keys(sessionData).forEach((key) => delete sessionData[key]);
      if (typeof callback === 'function') callback();
    }
  });

  Object.defineProperty(session, 'save', {
    enumerable: false,
    value: (callback) => {
      dirty = true;
      if (typeof callback === 'function') callback();
    }
  });

  req.session = session;

  const originalEnd = res.end.bind(res);
  res.end = function patchedEnd(...args) {
    if (destroyed) {
      res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        secure: req.secure || process.env.NODE_ENV === 'production'
      }));
    } else if (dirty && hasSessionContent(sessionData)) {
      res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, encodeSession(sessionData, secret), {
        maxAge: DAY_IN_MS,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
        secure: req.secure || process.env.NODE_ENV === 'production'
      }));
    }

    return originalEnd(...args);
  };

  next();
}

module.exports = { sessionMiddleware };
