const express = require('express');
const router = express.Router();
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { uploadDraft, approveDraft, requestRevision } = require('../controllers/draftController');

router.post('/:kode_tracking/upload', validateTrackingCode, uploadDraft);
router.post('/:kode_tracking/approve', validateTrackingCode, approveDraft);
router.post('/:kode_tracking/revisi', validateTrackingCode, requestRevision);

module.exports = router;