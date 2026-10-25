// Format resmi: NNNN/MM/YYYY(CODE) — contoh: 0001/01/2006(I), 0084/05/2026(L)
// Format legacy/mock (backward compatibility): LAB-2026-9001, LAB-2026-004
const TRACKING_CODE_REGEX = /^(\d{4}\/\d{2}\/\d{4}\([A-Za-z]+\)|[A-Za-z0-9_-]+)$/;

function validateTrackingCode(req, res, next) {
  const { kode_tracking } = req.params;
  if (!kode_tracking || !TRACKING_CODE_REGEX.test(kode_tracking.trim())) {
    return res.status(400).json({ message: 'Format kode tracking tidak valid.' });
  }
  next();
}

module.exports = { validateTrackingCode, TRACKING_CODE_REGEX };
