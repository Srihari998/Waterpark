const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking');
const { authCheck } = require('../middlewares/authMiddleware');

router.post('/', authCheck, bookingController.createBooking);
router.get('/', authCheck, bookingController.getUserBookings);

module.exports = router;
