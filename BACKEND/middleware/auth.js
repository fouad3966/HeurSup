const secret=process.env.JWT_SECRET;
const jwt=require('jsonwebtoken')

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    req.admin = decoded;
    next();
  });
};

module.exports = verifyToken;
