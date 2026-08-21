const express = require('express');
const router = express.Router();
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const { submitQuestionnaire } = require('../controllers/questionnaireController');

router.post('/:kode_tracking', validateTrackingCode, submitQuestionnaire);

module.exports = router;
