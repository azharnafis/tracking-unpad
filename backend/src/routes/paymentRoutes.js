const express = require('express');
const { upload } = require('../middleware/upload');
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const {
  getPaymentDetail,
  submitFaktur,
  uploadPaymentProof,
} = require('../controllers/paymentController');

// Path relatif terhadap /api/tracking/:kode_tracking (mergeParams).
const router = express.Router({ mergeParams: true });
router.get('/', validateTrackingCode, getPaymentDetail);
router.post('/faktur', validateTrackingCode, submitFaktur);
router.post(
  '/upload-proof',
  validateTrackingCode,
  upload.single('bukti_pembayaran'),
  uploadPaymentProof
);

module.exports = router;
