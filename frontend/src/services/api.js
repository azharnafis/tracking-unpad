import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// === Tracking ===
export function getTrackingStatus(kodeTracking) {
  return api.get(`/tracking/${kodeTracking}`).then((res) => res.data)
}

// === Payment ===
export function uploadPaymentProof(kodeTracking, file) {
  const formData = new FormData()
  formData.append('bukti_pembayaran', file)
  return api
    .post(`/payment/${kodeTracking}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => res.data)
}

// === Draft ===
export function getLatestDraft(kodeTracking) {
  return api.get(`/draft/${kodeTracking}/latest`).then((res) => res.data)
}

export function approveDraft(kodeTracking) {
  return api.post(`/draft/${kodeTracking}/approve`).then((res) => res.data)
}

export function requestDraftRevision(kodeTracking) {
  return api.post(`/draft/${kodeTracking}/revisi`).then((res) => res.data)
}

// === Questionnaire ===
export function submitQuestionnaire(kodeTracking, payload) {
  return api.post(`/questionnaire/${kodeTracking}`, payload).then((res) => res.data)
}

export default api