const jwt = require('jsonwebtoken');

const authCheck = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) return res.status(401).json({ message: 'Auth Error: No token provided' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch (e) {
        console.error(e);
        res.status(401).json({ message: 'Auth Error: Invalid token' });
    }
};

const adminCheck = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access only' });
    }
};

module.exports = { authCheck, adminCheck };
