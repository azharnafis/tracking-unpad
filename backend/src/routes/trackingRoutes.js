const express = require('express');
const router = express.Router();
const { getTrackingStatus } = require('../controllers/trackingController');

router.get('/:kode_tracking', getTrackingStatus);

module.exports = router;