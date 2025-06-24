const bcrypt = require('bcryptjs');

function updatePassword(newPassword) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(newPassword, salt);
    return { hash, salt };
}
function checkPassword(user, password) {
    if (!user) return false;
    const hash = bcrypt.hashSync(password, user.salt);
    return hash === user.password;
}

module.exports = {
    updatePassword,
    checkPassword
}