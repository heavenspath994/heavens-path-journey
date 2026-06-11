const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  // Token is usually in the format: "Bearer <token>"
  const tokenParts = token.split(' ');
  const actualToken = tokenParts.length === 2 ? tokenParts[1] : tokenParts[0];

  jwt.verify(actualToken, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized! Invalid token.' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Require Admin Role!' });
  }
  next();
};

const isUser = (req, res, next) => {
  if (req.userRole !== 'customer') {
    return res.status(403).json({ message: 'Require Customer Role!' });
  }
  next();
};

module.exports = {
  verifyToken,
  isAdmin,
  isUser
};
