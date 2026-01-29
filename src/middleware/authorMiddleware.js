module.exports = (req, res, next) => {
    if (req.user && req.user.role === 'author') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Access denied. Authors only.' });
    }
};
