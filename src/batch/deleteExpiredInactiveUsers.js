const pool = require("../config/db");

const deleteExpiredInactiveUsers = async () => {
  const [result] = await pool.query(`
    DELETE FROM user
    WHERE status = 'INACTIVE'
      AND inactive_date IS NOT NULL
      AND inactive_date < (NOW() - INTERVAL 30 DAY)
  `);

  return result;
};

module.exports = deleteExpiredInactiveUsers;
