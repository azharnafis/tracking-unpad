const express = require('express');
const router = express.Router();
const { uploadPaymentProof, validatePayment } = require('../controllers/paymentController');

router.post('/:kode_tracking/upload', uploadPaymentProof);
router.patch('/:kode_tracking/validate', validatePayment);

module.exports = router;