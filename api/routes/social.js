const express = require('express');
const router = express.Router();
const socialController = require('../controllers/social');
const { authCheck } = require('../middlewares/authMiddleware');

router.post('/reviews', authCheck, socialController.createReview);
router.get('/reviews', socialController.getReviews);
router.get('/reviews/:productName', socialController.getProductReviews);
router.get('/product-stats', socialController.getProductStats);
router.post('/react', authCheck, socialController.reactToReview);

module.exports = router;
