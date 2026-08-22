const express = require('express');
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { getLatestDraft, recordDecision } = require('../controllers/draftController');

// Path relatif terhadap /api/tracking/:kode_tracking (mergeParams).
const router = express.Router({ mergeParams: true });
router.get('/latest', validateTrackingCode, getLatestDraft);router.post('/decision', validateTrackingCode, recordDecision);

module.exports = router;
