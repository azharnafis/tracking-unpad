const express = require('express');
const router = express.Router();
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { getOrderDetail } = require('../controllers/trackingController');
const {
  getAdminPaymentDetail,
  setInvoiceDetails,
  validatePayment,
} = require('../controllers/paymentController');
const {
  uploadDraft,
  listDrafts,
  proceedToPengesahan,
} = require('../controllers/draftController');
const {
  upsertCertificate,
  getCertificate,
} = require('../controllers/certificateController');
const { getSurveyResults } = require('../controllers/questionnaireController');

// Tidak ada endpoint di sini yang menerima nilai status tracking —
// status hanya berubah sebagai efek samping business event tervalidasi.
router.get('/orders/:kode_tracking', validateTrackingCode, getOrderDetail);

router.get('/orders/:kode_tracking/payment', validateTrackingCode, getAdminPaymentDetail);
router.post('/orders/:kode_tracking/payment/invoice', validateTrackingCode, setInvoiceDetails);
router.post('/orders/:kode_tracking/payment/validate', validateTrackingCode, validatePayment);

router.post('/orders/:kode_tracking/draft', validateTrackingCode, uploadDraft);
router.get('/orders/:kode_tracking/draft', validateTrackingCode, listDrafts);
router.post('/orders/:kode_tracking/draft/proceed-to-pengesahan', validateTrackingCode, proceedToPengesahan);

router.post('/orders/:kode_tracking/certificate', validateTrackingCode, upsertCertificate);
router.get('/orders/:kode_tracking/certificate', validateTrackingCode, getCertificate);

router.get('/orders/:kode_tracking/survey', validateTrackingCode, getSurveyResults);

module.exports = router;
