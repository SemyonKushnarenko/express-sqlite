module.exports = function error(res, code, message) {
  return res.status(code).json({ error: message });
}