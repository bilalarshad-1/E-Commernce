const express = require('express');
const {
  getUsers,
  getUser,
  updateUserRole,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorize('super-admin', 'admin', 'manager'), getUsers);

router
  .route('/:id')
  .get(authorize('super-admin', 'admin', 'manager'), getUser)
  .put(authorize('super-admin', 'admin'), updateUser)
  .delete(authorize('super-admin', 'admin'), deleteUser);

router
  .route('/:id/role')
  .put(authorize('super-admin', 'admin'), updateUserRole);

module.exports = router;