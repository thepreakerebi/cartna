const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            branchId: decoded.id  // Store the branch ID for branch managers
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid authentication token' });
    }
};

module.exports = {
    authMiddleware
};