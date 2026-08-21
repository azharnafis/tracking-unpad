const TRACKING_CODE_REGEX = /^[A-Za-z0-9_-]+$/;

function validateTrackingCode(req, res, next) {
  const { kode_tracking } = req.params;
  if (!kode_tracking || !TRACKING_CODE_REGEX.test(kode_tracking)) {
    return res.status(400).json({ message: 'Format kode tracking tidak valid.' });
  }
  next();
}

module.exports = { validateTrackingCode };
