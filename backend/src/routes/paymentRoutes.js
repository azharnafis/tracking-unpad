const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { uploadPaymentProof, validatePayment } = require('../controllers/paymentController');

router.post('/:kode_tracking/upload', validateTrackingCode, upload.single('bukti_pembayaran'), uploadPaymentProof);
router.patch('/:kode_tracking/validate', validateTrackingCode, validatePayment);

module.exports = router;