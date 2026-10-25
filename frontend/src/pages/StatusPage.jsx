import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Flower2,
  Loader2,
  MessageSquare,
  PenLine,
  Receipt,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import { fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { adminWhatsapp, processSteps } from '../data/siteData'
import {
  getTrackingStatus,
  uploadPaymentProof,
  submitFaktur,
  recordDraftDecision,
} from '../services/api'

const noticeContent = {
  SAMPEL_DITERIMA: {
    title: 'Sampel Diterima',
    text: 'Sampel Anda telah diterima dan dicatat oleh admin laboratorium. Menunggu penerbitan invoice pembayaran.',
  },
  ANALISIS: {
    title: 'Analisis Sedang Berlangsung',
    text: 'Pembayaran telah terverifikasi. Sampel Anda sedang diproses dan diuji oleh tim analis laboratorium sesuai metode standar.',
  },
  PENGESAHAN: {
    title: 'Menunggu Pengesahan Hasil',
    text: 'Draft hasil pengujian telah disetujui dan sedang dalam proses pengesahan tanda tangan resmi oleh Kepala Laboratorium.',
  },
}

function formatTanggal(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTanggalWaktu(value) {
  if (!value) return '-'
  return (
    new Date(value).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB'
  )
}

function StatusStepper({ active, history }) {
  const activeIndex = processSteps.findIndex((step) => step.status === active)

  const statusLogMap = {}
  if (history && Array.isArray(history)) {
    history.forEach((log) => {
      if (log.status && !statusLogMap[log.status]) {
        statusLogMap[log.status] = log
      }
    })
  }

  return (
    <div className="relative mt-8 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      <div className="absolute left-0 right-0 top-8 hidden h-px bg-leaf-900/20 lg:block" />
      {processSteps.map((step, index) => {
        const Icon = step.icon
        const isDone = index < activeIndex
        const isActive = step.status === active
        const log = statusLogMap[step.status]
        const timestamp = (isDone || isActive) && log?.created_at ? formatTanggal(log.created_at) : null

        return (
          <div className="relative z-10 text-center" key={step.status}>
            <span
              className={`mx-auto grid h-16 w-16 place-items-center rounded-lg border transition-colors ${
                isActive
                  ? 'border-leaf-900 bg-leaf-900 text-white shadow-md'
                  : isDone
                    ? 'border-leaf-200 bg-leaf-200 text-leaf-900'
                    : 'border-leaf-900/20 bg-leaf-50 text-leaf-900'
              }`}
            >
              <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="mt-3 text-xs font-extrabold text-[#222820] sm:text-sm">{step.title}</p>
            {timestamp && (
              <p className="mt-1 text-[11px] font-medium text-[#6e7467]">{timestamp}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#777b70]">{label}</p>
      <p className="mt-1 text-lg font-medium text-[#222820]">{value}</p>
    </div>
  )
}

function EstimationWarning({ isWarning }) {
  if (!isWarning) return null
  return (
    <div className="mt-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-bold">Pemberitahuan Estimasi Waktu</p>
        <p className="mt-1 text-sm">
          Estimasi penyelesaian tinggal 2 hari kerja. Jika Anda memiliki pertanyaan mengenai progres pengujian, silakan hubungi admin Lab KTNT.
        </p>
      </div>
    </div>
  )
}

function SampleSummary({ order, invoiceNo, history }) {
  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-8" variants={fadeUp}>
      <h2 className="text-2xl font-extrabold text-[#20241f]">Proses Laboratorium</h2>
      <StatusStepper active={order.current_status} history={history} />
      <div className="mt-14 rounded-md border border-leaf-900/20 bg-white p-6 md:p-8">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-2xl font-extrabold text-leaf-900">{order.nama_perusahaan}</h3>
              <span className="inline-flex items-center rounded-full bg-leaf-100 px-3 py-1 font-mono text-xs font-bold text-leaf-900">
                {order.kode_tracking}
              </span>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Info label="Nomor Order" value={order.kode_tracking || '-'} />
              <Info label="No. Invoice" value={invoiceNo || '-'} />
              <Info label="Tanggal Masuk" value={formatTanggal(order.tanggal_masuk)} />
            </div>
          </div>
          <div className="flex items-center gap-4 rounded border border-leaf-900/20 bg-[#f4f3ee] px-4 py-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-200 text-leaf-900">
              <Clock className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#5e635a]">
                {order.estimasi?.is_selesai ? 'Status Pengujian' : 'Estimasi Selesai'}
              </p>
              <p className="text-2xl font-extrabold text-leaf-900">{order.estimasi?.label ?? '-'}</p>
              {order.estimasi?.is_selesai && order.estimasi?.tanggal_selesai_aktual && (
                <p className="mt-0.5 text-xs font-semibold text-[#5e635a]">
                  Selesai: {formatTanggal(order.estimasi.tanggal_selesai_aktual)}
                </p>
              )}
            </div>
          </div>
        </div>
        <EstimationWarning isWarning={order.estimasi?.is_warning} />
      </div>
    </motion.section>
  )
}

function Notice({ title, text, updatedAt, kwitansiUrl, isWarning }) {
  return (
    <motion.section className="rounded-md border border-[#d4ce8a] bg-[#f2efbc] p-6 md:p-8" variants={fadeUp}>
      <div className="flex gap-4">
        <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-black" />
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-black">{title}</h2>
          <p className="mt-4 text-base font-medium leading-8 text-black md:text-lg">{text}</p>

          {kwitansiUrl && (
            <div className="mt-6 flex items-center gap-3">
              <a
                href={kwitansiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded bg-leaf-800 px-4 py-2 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-900"
              >
                <Receipt className="h-4 w-4" /> Unduh Kwitansi Pembayaran Resmi
              </a>
            </div>
          )}

          {isWarning && (
            <div className="mt-6 rounded border border-amber-500/40 bg-amber-100/80 p-4 text-amber-950">
              <p className="text-sm font-semibold">
                Estimasi penyelesaian tinggal 2 hari kerja. Jika Anda memiliki pertanyaan mengenai progres pengujian, silakan hubungi admin Lab KTNT.
              </p>
            </div>
          )}

          <p className="mt-8 text-sm font-medium text-black">Terakhir diperbarui: {formatTanggalWaktu(updatedAt)}</p>
        </div>
      </div>
    </motion.section>
  )
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function TransferDetail({ rekening }) {
  const [copied, setCopied] = useState(false)
  const bankName = rekening?.bank ? `Bank ${rekening.bank}` : 'Bank Tujuan'
  const accountNo = rekening?.nomor_rekening || '-'

  function handleCopy() {
    if (accountNo && accountNo !== '-') {
      navigator.clipboard.writeText(accountNo)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-md border border-leaf-900/20 bg-white p-7">
      <h3 className="text-2xl font-extrabold text-[#47723e]">Detail Transfer</h3>
      <div className="mt-7 grid gap-5">
        <Info label="Bank Tujuan" value={bankName} />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#4d554b]">Nomor Rekening</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-lg font-extrabold text-[#222820]">{accountNo}</span>
            {accountNo !== '-' && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center text-xs font-bold text-leaf-800 hover:text-leaf-900"
                title="Salin nomor rekening"
              >
                <Copy className="h-4 w-4" />
                {copied && <span className="ml-1 text-[10px] text-green-700">Tersalin!</span>}
              </button>
            )}
          </div>
        </div>
        <Info label="Atas Nama" value="Lab KTNT Unpad" />
      </div>
    </div>
  )
}

function FakturForm({ kodeTracking, initialFaktur, initialNpwp, onSaved }) {
  const [jenisFaktur, setJenisFaktur] = useState(initialFaktur || 'NON_FAKTUR')
  const [npwp, setNpwp] = useState(initialNpwp || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(Boolean(initialFaktur))

  async function handleSaveFaktur(e) {
    if (e) e.preventDefault()
    setError('')

    if (jenisFaktur === 'FAKTUR_PAJAK' && !npwp.trim()) {
      setError('NPWP wajib diisi apabila memilih Faktur Pajak.')
      return
    }

    setSaving(true)
    try {
      await submitFaktur(kodeTracking, {
        jenis_faktur: jenisFaktur,
        npwp: jenisFaktur === 'FAKTUR_PAJAK' ? npwp.trim() : null,
      })
      setSavedSuccess(true)
      if (onSaved) onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan pilihan faktur. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-leaf-900/20 bg-white p-7">
      <h3 className="text-lg font-extrabold text-[#4a4f47]">Langkah 1: Pilihan Faktur Pajak</h3>
      <p className="mt-1 text-xs text-[#5e635a]">Tentukan apakah Anda membutuhkan Faktur Pajak atau Non Faktur sebelum mengunggah bukti bayar.</p>

      <form onSubmit={handleSaveFaktur} className="mt-5 space-y-4">
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded border border-leaf-900/15 p-3 hover:bg-leaf-50">
            <input
              type="radio"
              name="jenis_faktur"
              value="NON_FAKTUR"
              checked={jenisFaktur === 'NON_FAKTUR'}
              onChange={() => {
                setJenisFaktur('NON_FAKTUR')
                setSavedSuccess(false)
              }}
              className="h-4 w-4 text-leaf-800"
            />
            <span className="text-sm font-semibold text-[#222820]">Non Faktur (Kuitansi / Kwitansi Standar)</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3 rounded border border-leaf-900/15 p-3 hover:bg-leaf-50">
            <input
              type="radio"
              name="jenis_faktur"
              value="FAKTUR_PAJAK"
              checked={jenisFaktur === 'FAKTUR_PAJAK'}
              onChange={() => {
                setJenisFaktur('FAKTUR_PAJAK')
                setSavedSuccess(false)
              }}
              className="h-4 w-4 text-leaf-800"
            />
            <span className="text-sm font-semibold text-[#222820]">Faktur Pajak</span>
          </label>
        </div>

        {jenisFaktur === 'FAKTUR_PAJAK' && (
          <div className="mt-3">
            <label htmlFor="npwp-input" className="block text-xs font-bold text-[#4d554b]">
              Nomor Pokok Wajib Pajak (NPWP) *
            </label>
            <input
              id="npwp-input"
              type="text"
              className="mt-1.5 w-full rounded border border-leaf-900/20 bg-[#fbfaf6] px-3.5 py-2.5 text-sm outline-none focus:border-leaf-800"
              placeholder="Contoh: 01.234.567.8-901.000"
              value={npwp}
              onChange={(e) => {
                setNpwp(e.target.value)
                setSavedSuccess(false)
              }}
            />
          </div>
        )}

        {error && <p className="text-xs font-medium text-red-600">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700">
              <CheckCircle2 className="h-4 w-4" /> Preferensi faktur tersimpan
            </span>
          ) : (
            <span className="text-xs text-amber-700 font-medium">Klik simpan untuk konfirmasi</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center rounded bg-leaf-800 px-4 py-2 text-xs font-extrabold tracking-[0.06em] text-white hover:bg-leaf-900 disabled:opacity-50"
          >
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            {saving ? 'Menyimpan...' : 'Simpan Pilihan'}
          </button>
        </div>
      </form>
    </div>
  )
}

function PaymentSteps({ invoice }) {
  const invoiceUrl = invoice?.link_invoice
  return (
    <div className="rounded-md border border-leaf-900/20 bg-[#f4f3ee] p-7">
      <h3 className="text-lg font-extrabold text-[#4a4f47]">Langkah Pembayaran</h3>
      <div className="mt-6 grid gap-5">
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">1</span>
          <div>
            <p className="font-medium text-[#222820]">Download Invoice</p>
            {invoiceUrl ? (
              <a
                className="mt-3 inline-flex min-h-[34px] items-center gap-2 rounded border border-[#47723e] px-4 text-xs font-extrabold tracking-[0.08em] text-[#47723e] hover:bg-white"
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" /> Download Invoice {invoice?.no_invoice ? `(${invoice.no_invoice})` : ''}
              </a>
            ) : (
              <p className="mt-2 text-xs font-medium text-[#8a8f83]">Invoice sedang dipersiapkan oleh admin.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">2</span>
          <p className="font-medium text-[#222820]">Tentukan jenis faktur pada Langkah 1 dan transfer sesuai nominal ke rekening yang tertera.</p>
        </div>
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">3</span>
          <p className="font-medium text-[#222820]">Upload bukti transfer yang valid (JPG, PNG, atau PDF) setelah preferensi faktur tersimpan.</p>
        </div>
      </div>
    </div>
  )
}

function PaymentReview({ kodeTracking, payment, onRefresh }) {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedJustNow, setUploadedJustNow] = useState(false)
  const [localFakturSaved, setLocalFakturSaved] = useState(false)

  const invoice = payment?.invoice
  const rekening = payment?.rekening
  const validationStatus = payment?.status_validasi
  const hasInvoice = Boolean(invoice?.link_invoice)
  const hasExistingProof = Boolean(payment?.link_bukti_bayar || payment?.bukti_pembayaran_url)
  const isInvalid = validationStatus === 'INVALID'
  const isPending = validationStatus === 'PENDING' && (hasExistingProof || uploadedJustNow)
  const isFakturConfigured = Boolean(payment?.jenis_faktur) || localFakturSaved

  function handleFileChange(event) {
    const selected = event.target.files?.[0]
    setFileError('')
    setUploadError('')

    if (!selected) {
      setFile(null)
      return
    }
    if (!ALLOWED_FILE_TYPES.includes(selected.type)) {
      setFileError('Format file harus JPG, PNG, atau PDF.')
      setFile(null)
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFileError('Ukuran file maksimal 5MB.')
      setFile(null)
      return
    }
    setFile(selected)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      await uploadPaymentProof(kodeTracking, file)
      setUploadedJustNow(true)
      onRefresh()
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  function handleFakturSaved() {
    setLocalFakturSaved(true)
    onRefresh()
  }

  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-9" variants={fadeUp}>
      <div className="text-center">
        <h2 className="text-[30px] font-extrabold text-[#4a4f47]">Instruksi &amp; Bukti Pembayaran</h2>
        <p className="mt-1 font-medium text-[#4d554b]">
          Silakan selesaikan pembayaran untuk melanjutkan proses analisis laboratorium sampel Anda.
        </p>
      </div>

      {isInvalid && (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-red-300 bg-red-50 p-5 text-red-900">
          <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
          <div>
            <p className="text-base font-extrabold text-red-800">Pembayaran Tidak Valid / Ditolak Admin</p>
            <p className="mt-1 text-sm text-red-700">
              Bukti pembayaran sebelumnya tidak dapat divalidasi. Silakan periksa kembali nominal transfer dan unggah ulang bukti transfer yang benar di bawah ini.
            </p>
          </div>
        </div>
      )}

      <div className="mt-9 grid gap-9 lg:grid-cols-[445px_1fr]">
        <div className="grid content-start gap-6">
          <TransferDetail rekening={rekening} />
          <FakturForm
            kodeTracking={kodeTracking}
            initialFaktur={payment?.jenis_faktur}
            initialNpwp={payment?.npwp}
            onSaved={handleFakturSaved}
          />
          <PaymentSteps invoice={invoice} />
        </div>

        <div className="grid min-h-[430px] place-items-center rounded-md border border-leaf-900/20 bg-white p-8 text-center">
          {isPending && !isInvalid ? (
            <div className="max-w-[560px]">
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-leaf-800 text-white shadow-[0_16px_50px_rgba(45,72,32,0.18)]">
                <CheckCircle2 className="h-12 w-12" />
              </span>
              <h3 className="mt-7 text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900">
                Pembayaran Sedang Diperiksa
              </h3>
              <p className="mt-5 text-lg font-medium leading-8 text-[#4d554b]">
                Tim administrasi laboratorium sedang memverifikasi bukti pembayaran Anda. Anda akan menerima pembaruan status setelah verifikasi selesai.
              </p>
              {payment?.link_kwitansi && (
                <div className="mt-6">
                  <a
                    href={payment.link_kwitansi}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded bg-leaf-800 px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-900"
                  >
                    <Receipt className="h-4 w-4" /> Unduh Kwitansi Resmi
                  </a>
                </div>
              )}
            </div>
          ) : !hasInvoice ? (
            <div className="max-w-[420px] text-center">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-amber-100 text-amber-800">
                <Clock className="h-10 w-10" />
              </span>
              <h3 className="mt-5 text-xl font-extrabold text-[#222820]">Menunggu Invoice</h3>
              <p className="mt-2 text-sm font-medium text-[#4d554b]">
                Invoice pengujian sampel sedang diterbitkan oleh admin laboratorium. Form upload bukti transfer akan aktif setelah invoice tersedia.
              </p>
            </div>
          ) : !isFakturConfigured ? (
            <div className="max-w-[420px] text-center p-6 rounded border border-amber-300/70 bg-amber-50/70">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-800 mb-4">
                <AlertTriangle className="h-8 w-8" />
              </span>
              <h4 className="text-base font-bold text-amber-950">Lengkapi Preferensi Faktur Terlebih Dahulu</h4>
              <p className="mt-2 text-xs font-medium text-amber-900 leading-relaxed">
                Silakan tentukan pilihan Faktur Pajak / Non Faktur pada panel <strong>Langkah 1</strong> di sebelah kiri dan klik <strong>Simpan Pilihan</strong> untuk membuka akses formulir unggah bukti pembayaran.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-[420px] text-left">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-100 text-leaf-900">
                <UploadCloud className="h-10 w-10" />
              </span>
              <label className="mt-6 block cursor-pointer rounded border border-dashed border-leaf-900/30 bg-[#f8f7f2] px-5 py-6 text-center hover:bg-[#f2efe6] transition-colors">
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                <span className="text-sm font-extrabold text-leaf-900">
                  {file ? file.name : 'Klik untuk pilih file bukti transfer (JPG, PNG, atau PDF, maks 5MB)'}
                </span>
              </label>
              {fileError && <p className="mt-3 text-sm font-medium text-red-600">{fileError}</p>}
              {uploadError && <p className="mt-3 text-sm font-medium text-red-600">{uploadError}</p>}
              <button
                className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded bg-leaf-800 px-5 text-xs font-extrabold tracking-[0.08em] text-white transition-colors duration-200 hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                {uploading ? 'Mengunggah...' : isInvalid ? 'Unggah Ulang Bukti Pembayaran' : 'Upload Bukti Pembayaran'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function DraftPreview({ kodeTracking, latestDraft, onRefresh }) {
  const [approving, setApproving] = useState(false)
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState('')

  const keputusan = latestDraft?.keputusan_customer
  const isSetuju = keputusan === 'SETUJU'
  const isRevisi = keputusan === 'REVISI'

  async function handleApprove() {
    setApproving(true)
    setError('')
    try {
      await recordDraftDecision(kodeTracking, 'SETUJU')
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyetujui draft. Silakan coba lagi.')
    } finally {
      setApproving(false)
    }
  }

  async function handleRevisi() {
    setRevising(true)
    setError('')
    try {
      await recordDraftDecision(kodeTracking, 'REVISI')
      const waUrl = `https://wa.me/${adminWhatsapp.phoneRaw}?text=${encodeURIComponent(
        `Halo Admin Lab KTNT, saya ingin mengajukan revisi draft pengujian dengan nomor order: ${kodeTracking}`
      )}`
      window.open(waUrl, '_blank')
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan revisi. Silakan coba lagi.')
    } finally {
      setRevising(false)
    }
  }

  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-8" variants={fadeUp}>
      <div className="text-center">
        <h2 className="text-[30px] font-extrabold text-[#4a4f47]">Review Draft Hasil Pengujian</h2>
        <p className="mt-1 font-medium text-[#4d554b]">Periksa dengan teliti hasil analisis sebelum pengesahan akhir dokumen.</p>
      </div>

      {isSetuju && (
        <div className="mt-6 rounded-md border border-green-300 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-700" />
          <h3 className="mt-3 text-xl font-extrabold text-green-900">Persetujuan Anda Telah Tercatat</h3>
          <p className="mt-2 text-sm text-green-800 max-w-xl mx-auto">
            Persetujuan Anda telah tercatat dan sedang menunggu proses pengesahan tanda tangan resmi oleh Kepala Laboratorium.
          </p>
        </div>
      )}

      {isRevisi && (
        <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-6 text-center">
          <PenLine className="mx-auto h-12 w-12 text-amber-700" />
          <h3 className="mt-3 text-xl font-extrabold text-amber-900">Catatan Revisi Telah Tercatat</h3>
          <p className="mt-2 text-sm text-amber-800 max-w-xl mx-auto">
            Catatan revisi Anda telah tercatat. Silakan hubungi admin via WhatsApp untuk detail perbaikan. Tim lab akan mengunggah draft revisi baru setelah selesai diperbaiki.
          </p>
          <a
            href={`https://wa.me/${adminWhatsapp.phoneRaw}?text=${encodeURIComponent(
              `Halo Admin Lab KTNT, saya ingin konsultasi detail revisi draft pengujian: ${kodeTracking}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded bg-leaf-800 px-5 py-2.5 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-900"
          >
            <MessageSquare className="h-4 w-4" /> Hubungi Admin via WhatsApp ({adminWhatsapp.phoneDisplay})
          </a>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        {latestDraft?.link_draft ? (
          <div className="overflow-hidden rounded-md border border-leaf-900/20 bg-[#e9e7df] p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#4d554b]" />
            <p className="mt-4 text-sm font-bold text-[#4d554b]">
              Draft Hasil Pengujian — Versi {latestDraft.versi_draft}
            </p>
            {latestDraft.tanggal_upload && (
              <p className="mt-1 text-xs text-[#6e7467]">Diunggah: {formatTanggal(latestDraft.tanggal_upload)}</p>
            )}
            <a
              className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded bg-leaf-800 px-5 text-xs font-extrabold tracking-[0.08em] text-white transition-colors hover:bg-leaf-900"
              href={latestDraft.link_draft}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="h-4 w-4" /> Buka Draft PDF
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-leaf-900/20 bg-[#e9e7df] p-8 text-center text-[#4d554b]">
            Draft belum tersedia.
          </div>
        )}

        <div className="grid content-start gap-6">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <ActionCard
            icon={CheckCircle2}
            title="Setujui Draft"
            text="Draft hasil pengujian sudah sesuai. Keputusan persetujuan Anda akan dicatat untuk proses pengesahan oleh admin laboratorium."
            button={isSetuju ? 'Draft Telah Disetujui' : 'Setujui Draft'}
            primary
            disabled={Boolean(keputusan) || approving}
            onAction={handleApprove}
            loading={approving}
          />
          <ActionCard
            icon={PenLine}
            title="Minta Revisi"
            text="Terdapat kesalahan pada data parameter, identitas, atau hasil analisis? Ajukan revisi ke admin laboratorium."
            button={isRevisi ? 'Revisi Telah Diajukan' : 'Ajukan Catatan Revisi'}
            disabled={Boolean(keputusan) || revising}
            onAction={handleRevisi}
            loading={revising}
          />
        </div>
      </div>
    </motion.section>
  )
}

function ActionCard({ icon: Icon, title, text, button, primary = false, onAction, loading = false, disabled = false }) {
  return (
    <div className="rounded-md border border-leaf-900/20 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ${
            primary ? 'bg-[#c8f2bd] text-leaf-900' : 'bg-[#e6e4dc] text-[#4a4f47]'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-2xl font-extrabold text-[#222820]">{title}</h3>
      </div>
      <p className="mt-6 text-sm font-medium leading-7 text-[#4d554b]">{text}</p>
      {button && (
        <button
          className={`mt-6 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded px-4 text-xs font-extrabold tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50 ${
            primary ? 'bg-leaf-800 text-white hover:bg-leaf-900' : 'border border-leaf-900/20 bg-white text-[#4a4f47] hover:bg-leaf-50'
          }`}
          type="button"
          disabled={disabled || loading}
          onClick={onAction}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {button}
        </button>
      )}
    </div>
  )
}

function SurveyPrompt({ kodeTracking, onNavigate }) {
  return (
    <motion.section className="rounded-md bg-leaf-800 p-7 text-center text-white md:p-8" variants={fadeUp}>
      <h2 className="text-2xl font-extrabold">Satu Langkah Lagi</h2>
      <p className="mx-auto mt-3 max-w-xl text-base font-medium text-white/80">
        Sertifikat Hasil Uji (SHU) Anda sudah diterbitkan. Silakan isi kuesioner kepuasan pelanggan resmi untuk membuka akses unduh sertifikat.
      </p>
      <button
        className="mx-auto mt-6 inline-flex min-h-[46px] items-center justify-center rounded bg-white px-6 text-xs font-extrabold tracking-[0.08em] text-leaf-900 hover:bg-leaf-50"
        type="button"
        onClick={() => onNavigate('survey', kodeTracking)}
      >
        Isi Kuesioner Sekarang
      </button>
    </motion.section>
  )
}

function ReadyDownload({ order, certificate }) {
  const batasRevisi = certificate?.tanggal_batas_revisi
  const masihBisaRevisi = certificate?.masih_dalam_periode_revisi

  return (
    <motion.div className="grid gap-8" variants={staggerContainer}>
      <motion.section className="rounded-md bg-leaf-800 p-7 text-white md:p-8" variants={fadeUp}>
        <div className="flex gap-4">
          <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-leaf-200" />
          <div>
            <h2 className="text-[30px] font-extrabold">Pengujian Selesai!</h2>
            <p className="mt-3 max-w-4xl text-base font-medium leading-7 text-white/72">
              Sertifikat Hasil Uji (SHU) untuk sampel Anda telah diterbitkan dan siap untuk diunduh. Terima kasih telah mempercayakan pengujian kepada Laboratorium KTNT Fakultas Pertanian UNPAD.
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section className="grid gap-6 lg:grid-cols-[425px_1fr]" variants={fadeUp}>
        <div className="rounded-md border border-leaf-900/20 bg-white p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4d554b]">Detail Pengujian</h3>
          <div className="mt-6 grid gap-5 text-base">
            <Info label="Nomor Order" value={order.kode_tracking} />
            <div className="h-px bg-leaf-900/15" />
            <Info label="Tanggal Terbit" value={formatTanggal(certificate?.tanggal_terbit)} />
            {batasRevisi && (
              <div className="rounded bg-leaf-50 p-3 text-xs text-[#4d554b]">
                <p className="font-bold text-leaf-900">Batas Pengajuan Revisi Sertifikat:</p>
                <p className="mt-1">{formatTanggal(batasRevisi)} (14 hari kerja)</p>
                {masihBisaRevisi ? (
                  <span className="mt-1 inline-block text-[11px] font-semibold text-green-700">
                    Masih dalam periode revisi
                  </span>
                ) : (
                  <span className="mt-1 inline-block text-[11px] font-semibold text-amber-700">
                    Periode revisi telah berakhir
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-md border border-leaf-900/20 bg-[#f4f3ee] p-6 text-center">
          <div className="mx-auto grid min-h-[335px] max-w-[240px] place-items-center border border-leaf-900/20 bg-[#f1f0ea] px-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-leaf-900">
              <FileCheck2 className="h-6 w-6" />
            </span>
          </div>
          {certificate?.link_sertifikat ? (
            <div className="mt-7 space-y-3">
              <a
                className="mx-auto inline-flex min-h-[48px] w-full max-w-[380px] items-center justify-center gap-3 rounded-lg bg-leaf-900 px-6 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-800"
                href={certificate.link_sertifikat}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-5 w-5" /> Download Sertifikat PDF
              </a>
              <div>
                <a
                  href={`https://wa.me/${adminWhatsapp.phoneRaw}?text=${encodeURIComponent(
                    `Halo Admin Lab KTNT, saya ingin konsultasi mengenai sertifikat pengujian ${order.kode_tracking}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-leaf-800 hover:text-leaf-900"
                >
                  <MessageSquare className="h-3.5 w-3.5" /> Butuh bantuan atau revisi? Hubungi Admin via WhatsApp ({adminWhatsapp.phoneDisplay})
                </a>
              </div>
            </div>
          ) : (
            <p className="mt-7 text-sm font-medium text-[#4d554b]">Link sertifikat belum tersedia.</p>
          )}
        </div>
      </motion.section>

      <motion.section className="mx-auto max-w-[520px] border-t border-leaf-900/20 pt-8 text-center" variants={fadeUp}>
        <Flower2 className="mx-auto h-9 w-9 text-leaf-700" />
        <h2 className="mt-3 text-2xl font-extrabold text-leaf-900">Terima Kasih</h2>
        <p className="mt-3 font-medium leading-7 text-[#4d554b]">
          Kami berharap hasil analisis ini dapat berkontribusi positif bagi penelitian atau pengelolaan lahan pertanian Anda.
        </p>
      </motion.section>
    </motion.div>
  )
}

export function StatusPage({ kodeTracking, onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!kodeTracking) {
      setError('Kode tracking tidak ditemukan. Silakan cari ulang dari halaman Lacak Sampel.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    getTrackingStatus(kodeTracking)
      .then((result) => setData(result))
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Kode tracking tidak ditemukan. Periksa kembali kode yang Anda masukkan.')
        } else {
          setError('Terjadi kesalahan saat memuat data. Silakan coba lagi.')
        }
      })
      .finally(() => setLoading(false))
  }, [kodeTracking])

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-leaf-50">
        <div className="flex items-center gap-3 text-leaf-900">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-medium">Memuat status sampel...</span>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-leaf-50 px-5 text-center">
        <div>
          <p className="text-lg font-extrabold text-[#222820]">{error}</p>
          <button
            className="mx-auto mt-6 inline-flex min-h-[44px] items-center rounded bg-leaf-800 px-5 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-900"
            type="button"
            onClick={() => onNavigate('tracking')}
          >
            Kembali ke Lacak Sampel
          </button>
        </div>
      </main>
    )
  }

  const {
    order,
    history,
    payment,
    certificate,
    survey_completed: surveyCompleted,
    latest_draft: latestDraft,
  } = data
  const status = order.current_status
  const lastLog = history && history.length > 0 ? history[history.length - 1] : null
  const invoiceNo = payment?.invoice?.no_invoice || order.kode_invoice

  function refreshData() {
    getTrackingStatus(kodeTracking)
      .then((result) => setData(result))
      .catch(() => {})
  }

  return (
    <>
      <main className="bg-leaf-50 px-5 py-14 sm:px-8 lg:px-10">
        <motion.div className="mx-auto max-w-[1200px]" initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <h1 className="text-[30px] font-extrabold text-leaf-900">Status Sampel</h1>
            <p className="mt-2 font-medium text-[#4d554b]">Lacak progres analisis sampel Anda secara real-time.</p>
          </motion.div>
          <div className="mt-12 grid gap-12">
            <SampleSummary order={order} invoiceNo={invoiceNo} history={history} />

            {status === 'PEMBAYARAN' && (
              <PaymentReview kodeTracking={kodeTracking} payment={payment} onRefresh={refreshData} />
            )}

            {status === 'ANALISIS' && (
              <Notice
                title={noticeContent.ANALISIS.title}
                text={noticeContent.ANALISIS.text}
                updatedAt={lastLog?.created_at}
                kwitansiUrl={payment?.link_kwitansi}
                isWarning={order.estimasi?.is_warning}
              />
            )}

            {status === 'REVIEW_DRAFT' && (
              <DraftPreview kodeTracking={kodeTracking} latestDraft={latestDraft} onRefresh={refreshData} />
            )}

            {['SAMPEL_DITERIMA', 'PENGESAHAN'].includes(status) && (
              <Notice
                title={noticeContent[status]?.title}
                text={noticeContent[status]?.text}
                updatedAt={lastLog?.created_at}
              />
            )}

            {status === 'DOWNLOAD_SERTIFIKAT' &&
              (surveyCompleted ? (
                <ReadyDownload order={order} certificate={certificate} />
              ) : (
                <SurveyPrompt kodeTracking={kodeTracking} onNavigate={onNavigate} />
              ))}
          </div>
        </motion.div>
      </main>
      <Footer compact />
    </>
  )
}