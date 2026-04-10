const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const { authCheck, adminCheck } = require('../middlewares/authMiddleware');

router.get('/metrics', authCheck, adminCheck, adminController.getMetrics);
router.get('/graph', authCheck, adminCheck, adminController.getGraphData);
router.delete('/users/:username', authCheck, adminCheck, adminController.deleteUser);

module.exports = router;
