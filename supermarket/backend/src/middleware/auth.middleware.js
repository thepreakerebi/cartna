const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Set both user and admin properties for compatibility
        req.user = {
            id: decoded.id,
            role: decoded.role,
            branchId: decoded.id // For branch managers, id is their branchId
        };
        req.admin = {
            id: decoded.id,
            isAdmin: decoded.isAdmin
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid authentication token' });
    }
};

module.exports = {
    authMiddleware
};