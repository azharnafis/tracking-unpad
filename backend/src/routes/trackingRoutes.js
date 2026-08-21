const express = require('express');
const router = express.Router();
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { getTrackingStatus } = require('../controllers/trackingController');

router.get('/:kode_tracking', validateTrackingCode, getTrackingStatus);

module.exports = router;