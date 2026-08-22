const express = require('express');
const router = express.Router();
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const {
  getTrackingStatus,
  getStatus,
  getTimeline,
  getEstimation,
} = require('../controllers/trackingController');
const { getCustomerCertificate } = require('../controllers/certificateController');
const paymentRoutes = require('./paymentRoutes');
const draftRoutes = require('./draftRoutes');
const questionnaireRoutes = require('./questionnaireRoutes');

router.use('/:kode_tracking/payment', paymentRoutes);
router.use('/:kode_tracking/draft', draftRoutes);
router.use('/:kode_tracking/survey', questionnaireRoutes);

router.get('/:kode_tracking', validateTrackingCode, getTrackingStatus);
router.get('/:kode_tracking/status', validateTrackingCode, getStatus);
router.get('/:kode_tracking/timeline', validateTrackingCode, getTimeline);
router.get('/:kode_tracking/estimation', validateTrackingCode, getEstimation);
router.get('/:kode_tracking/certificate', validateTrackingCode, getCustomerCertificate);

module.exports = router;
