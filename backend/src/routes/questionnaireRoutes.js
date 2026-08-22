const express = require('express');
const { validateTrackingCode } = require('../middleware/validateTrackingCode');
const {
  getSurveyContext,
  submitSurvey,
  getSurveyCompletion,
} = require('../controllers/questionnaireController');

// Path relatif terhadap /api/tracking/:kode_tracking (mergeParams).
const router = express.Router({ mergeParams: true });
router.get('/', validateTrackingCode, getSurveyContext);
router.post('/', validateTrackingCode, submitSurvey);
router.get('/completion', validateTrackingCode, getSurveyCompletion);

module.exports = router;
