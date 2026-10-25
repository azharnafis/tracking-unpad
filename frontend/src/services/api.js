import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
})

function encodeCode(kodeTracking) {
  return encodeURIComponent(String(kodeTracking || '').trim())
}

// === Tracking Domain ===
export function getTrackingStatus(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}`).then((res) => res.data)
}

export function getTrackingTimeline(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/timeline`).then((res) => res.data)
}

export function getTrackingEstimation(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/estimation`).then((res) => res.data)
}

export function getCustomerCertificate(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/certificate`).then((res) => res.data)
}

// === Payment Domain ===
export function getPaymentDetail(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/payment`).then((res) => res.data)
}

export function submitFaktur(kodeTracking, payload) {
  // payload: { jenis_faktur: 'FAKTUR_PAJAK' | 'NON_FAKTUR', npwp?: string }
  return api.post(`/tracking/${encodeCode(kodeTracking)}/payment/faktur`, payload).then((res) => res.data)
}

export function uploadPaymentProof(kodeTracking, file) {
  const formData = new FormData()
  formData.append('bukti_pembayaran', file)
  return api
    .post(`/tracking/${encodeCode(kodeTracking)}/payment/upload-proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

// === Draft Domain ===
export function getLatestDraft(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/draft/latest`).then((res) => res.data)
}

export function recordDraftDecision(kodeTracking, keputusan) {
  // keputusan: 'SETUJU' | 'REVISI'
  return api.post(`/tracking/${encodeCode(kodeTracking)}/draft/decision`, { keputusan }).then((res) => res.data)
}

// Decision aliases
export function approveDraft(kodeTracking) {
  return recordDraftDecision(kodeTracking, 'SETUJU')
}

export function requestDraftRevision(kodeTracking) {
  return recordDraftDecision(kodeTracking, 'REVISI')
}

// === Survey Domain ===
export function getSurveyContext(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/survey`).then((res) => res.data)
}

export function submitSurvey(kodeTracking, payload) {
  // payload: { q01, q02, ..., q14, saran }
  return api.post(`/tracking/${encodeCode(kodeTracking)}/survey`, payload).then((res) => res.data)
}

export function getSurveyCompletion(kodeTracking) {
  return api.get(`/tracking/${encodeCode(kodeTracking)}/survey/completion`).then((res) => res.data)
}

export function submitQuestionnaire(kodeTracking, payload) {
  return submitSurvey(kodeTracking, payload)
}

export default api