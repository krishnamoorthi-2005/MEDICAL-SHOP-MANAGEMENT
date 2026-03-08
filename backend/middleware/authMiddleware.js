import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;

    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authorization token is required' });
    }

    if (!JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured. Set it in the environment.');
      return res.status(500).json({ success: false, message: 'Server JWT configuration missing' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export default authenticate;
