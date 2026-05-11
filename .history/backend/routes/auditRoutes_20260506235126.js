const express = require('express');
const {
  getAuditLogs,
  getUserAuditLogs,
} = require('../controllers/auditController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('super-admin', 'admin'));

router.route('/').get(getAuditLogs);
router.route('/user/:userId').get(getUserAuditLogs);

module.exports = router;