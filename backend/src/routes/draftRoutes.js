const express = require('express');
const router = express.Router();
const { uploadDraft, approveDraft, requestRevision } = require('../controllers/draftController');

router.post('/:kode_tracking/upload', uploadDraft);
router.post('/:kode_tracking/approve', approveDraft);
router.post('/:kode_tracking/revisi', requestRevision);

module.exports = router;