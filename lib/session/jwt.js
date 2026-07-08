import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing');
}

const SESSION_EXPIRES_IN = '7d';

export function signSession(user) {
  return jwt.sign(
    {
      id: user.id,
      firebaseUid: user.firebaseUid,
      role: user.role,
    },
    JWT_SECRET,
    {
      expiresIn: SESSION_EXPIRES_IN,
    }
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}