module.exports = function dbError(res) {
    return res.status(500).json({ error: 'Database error' });
}