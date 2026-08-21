import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  CircleAlert,
  Clock,
  Copy,
  Download,
  FileText,
  Flower2,
  Loader2,
  PenLine,
  UploadCloud,
} from 'lucide-react'
import { fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { processSteps } from '../data/siteData'
import { getTrackingStatus, uploadPaymentProof, approveDraft, requestDraftRevision } from '../services/api'

const noticeContent = {
  SAMPEL_DITERIMA: {
    title: 'Sampel Diterima',
    text: 'Sampel Anda telah diterima dan dicatat oleh admin laboratorium. Menunggu proses selanjutnya.',
  },
  PROSES_ANALISIS: {
    title: 'Analisis Sedang Berlangsung',
    text: 'Sampel Anda sedang diproses oleh tim laboratorium sesuai metode pengujian yang dipilih. Tidak ada tindakan yang perlu dilakukan saat ini.',
  },
  INPUT_DATA_HASIL: {
    title: 'Input Data Sedang Diproses',
    text: 'Hasil pengujian sedang diverifikasi dan diinput ke dalam draft. Tidak ada tindakan yang perlu dilakukan saat ini.',
  },
  PENGESAHAN: {
    title: 'Menunggu Pengesahan Hasil',
    text: 'Dokumen hasil pengujian sedang menunggu persetujuan dari penanggung jawab laboratorium.',
  },
}

function formatTanggal(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTanggalWaktu(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) + ' WIB'
}

function StatusStepper({ active }) {
  const activeIndex = processSteps.findIndex((step) => step.status === active)

  return (
    <div className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4">
      <div className="absolute left-0 right-0 top-8 hidden h-px bg-leaf-900/20 lg:block" />
      {processSteps.map((step, index) => {
        const Icon = step.icon
        const isDone = index < activeIndex
        const isActive = step.status === active
        return (
          <div className="relative z-10 text-center" key={step.status}>
            <span className={`mx-auto grid h-16 w-16 place-items-center rounded-lg border transition-colors ${isActive ? 'border-leaf-900 bg-leaf-900 text-white' : isDone ? 'border-leaf-200 bg-leaf-200 text-leaf-900' : 'border-leaf-900/20 bg-leaf-50 text-leaf-900'}`}>
              <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
            </span>
            <p className="mt-4 text-xs font-extrabold text-[#222820] sm:text-sm">{step.title}</p>
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

function SampleSummary({ order }) {
  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-8" variants={fadeUp}>
      <h2 className="text-2xl font-extrabold text-[#20241f]">Proses Laboratorium</h2>
      <StatusStepper active={order.current_status} />
      <div className="mt-14 rounded-md border border-leaf-900/20 bg-white p-6 md:p-8">
        <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto]">
          <div>
            <h3 className="text-2xl font-extrabold text-leaf-900">{order.nama_perusahaan}</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <Info label="No. Invoice" value={order.kode_invoice || '-'} />
              <Info label="Jenis Analisis" value={order.jenis_analisis_sampel} />
              <Info label="Tanggal Masuk" value={formatTanggal(order.tanggal_masuk)} />
            </div>
          </div>
          <div className="flex items-center gap-4 rounded border border-leaf-900/20 bg-[#f4f3ee] px-4 py-4">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-leaf-200 text-leaf-900"><Clock className="h-6 w-6" /></span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#5e635a]">Estimasi Selesai</p>
              <p className="text-2xl font-extrabold text-leaf-900">{order.estimasi?.label ?? '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function Notice({ title, text, updatedAt }) {
  return (
    <motion.section className="rounded-md border border-[#d4ce8a] bg-[#f2efbc] p-6 md:p-8" variants={fadeUp}>
      <div className="flex gap-4">
        <CircleAlert className="mt-1 h-5 w-5 shrink-0 text-black" />
        <div>
          <h2 className="text-xl font-extrabold text-black">{title}</h2>
          <p className="mt-4 text-base font-medium leading-8 text-black md:text-lg">{text}</p>
          <p className="mt-8 text-sm font-medium text-black">Terakhir diperbarui: {formatTanggalWaktu(updatedAt)}</p>
        </div>
      </div>
    </motion.section>
  )
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_SIZE = 5 * 1024 * 1024

function PaymentReview({ kodeTracking, invoiceUrl }) {
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploaded, setUploaded] = useState(false)

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
      setUploaded(true)
    } catch (err) {
      setUploadError('Gagal mengunggah bukti pembayaran. Silakan coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-9" variants={fadeUp}>
      <div className="text-center">
        <h2 className="text-[30px] font-extrabold text-[#4a4f47]">Upload Bukti Pembayaran</h2>
        <p className="mt-1 font-medium text-[#4d554b]">Silakan selesaikan pembayaran untuk melanjutkan proses analisis sampel Anda.</p>
      </div>
      <div className="mt-9 grid gap-9 lg:grid-cols-[445px_1fr]">
        <div className="grid content-start gap-6">
          <TransferDetail />
          <PaymentSteps invoiceUrl={invoiceUrl} />
        </div>
        <div className="grid min-h-[430px] place-items-center rounded-md border border-leaf-900/20 bg-white p-8 text-center">
          {uploaded ? (
            <div className="max-w-[560px]">
              <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-leaf-800 text-white shadow-[0_16px_50px_rgba(45,72,32,0.18)]">
                <CheckCircle2 className="h-12 w-12" />
              </span>
              <h3 className="mt-7 text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900">Pembayaran Sedang Diperiksa</h3>
              <p className="mt-5 text-lg font-medium leading-8 text-[#4d554b]">Tim administrasi kami sedang melakukan verifikasi pembayaran Anda. Anda akan menerima notifikasi setelah status diperbarui.</p>
            </div>
          ) : (
            <div className="w-full max-w-[420px] text-left">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-leaf-100 text-leaf-900">
                <UploadCloud className="h-10 w-10" />
              </span>
              <label className="mt-6 block cursor-pointer rounded border border-dashed border-leaf-900/30 bg-[#f8f7f2] px-5 py-6 text-center">
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                <span className="text-sm font-extrabold text-leaf-900">
                  {file ? file.name : 'Klik untuk pilih file (JPG, PNG, atau PDF, maks 5MB)'}
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
                {uploading ? 'Mengunggah...' : 'Upload Bukti Pembayaran'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function TransferDetail() {
  return (
    <div className="rounded-md border border-leaf-900/20 bg-white p-7">
      <h3 className="text-2xl font-extrabold text-[#47723e]">Detail Transfer</h3>
      <div className="mt-7 grid gap-5">
        <Info label="Bank Tujuan" value="Bank BNI" />
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#4d554b]">Nomor Rekening</p>
          <p className="mt-1 flex items-center gap-2 text-lg font-extrabold text-[#222820]">1234567890 <Copy className="h-4 w-4 text-[#47723e]" /></p>
        </div>
        <Info label="Atas Nama" value="Lab KTNT Unpad" />
      </div>
    </div>
  )
}

function PaymentSteps({ invoiceUrl }) {
  return (
    <div className="rounded-md border border-leaf-900/20 bg-[#f4f3ee] p-7">
      <h3 className="text-lg font-extrabold text-[#4a4f47]">Langkah Pembayaran</h3>
      <div className="mt-6 grid gap-5">
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">1</span>
          <div>
            <p className="font-medium text-[#222820]">Download Invoice</p>
            {invoiceUrl ? (<a
                className="mt-3 inline-flex min-h-[34px] items-center gap-2 rounded border border-[#47723e] px-4 text-xs font-extrabold tracking-[0.08em] text-[#47723e]"
                href={invoiceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <Download className="h-4 w-4" />Download Invoice
              </a>
            ) : (
              <p className="mt-3 text-xs font-medium text-[#8a8f83]">Invoice belum tersedia.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">2</span>
          <p className="font-medium text-[#222820]">Transfer sesuai nominal ke rekening yang tertera.</p>
        </div>
        <div className="grid grid-cols-[26px_1fr] gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#47723e] text-xs font-extrabold text-white">3</span>
          <p className="font-medium text-[#222820]">Upload bukti transfer yang valid.</p>
        </div>
      </div>
    </div>
  )
}

function DraftPreview({ kodeTracking, latestDraft, onRefresh }) {
  const [approving, setApproving] = useState(false)
  const [revising, setRevising] = useState(false)
  const [error, setError] = useState('')
  const [approved, setApproved] = useState(false)

  async function handleApprove() {
    setApproving(true)
    setError('')
    try {
      await approveDraft(kodeTracking)
      setApproved(true)
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
      const result = await requestDraftRevision(kodeTracking)
      if (result.whatsapp_url) window.open(result.whatsapp_url, '_blank')
      onRefresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengajukan revisi. Silakan coba lagi.')
    } finally {
      setRevising(false)
    }
  }

  if (approved) {
    return (
      <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-9" variants={fadeUp}>
        <div className="grid min-h-[430px] place-items-center text-center">
          <div className="max-w-[560px]">
            <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-leaf-800 text-white shadow-[0_16px_50px_rgba(45,72,32,0.18)]">
              <CheckCircle2 className="h-12 w-12" />
            </span>
            <h3 className="mt-7 text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900">Menunggu Verifikasi Admin</h3>
            <p className="mt-5 text-lg font-medium leading-8 text-[#4d554b]">Persetujuan Anda telah dikirim ke admin. Status akan diperbarui setelah admin melakukan verifikasi.</p>
          </div>
        </div>
      </motion.section>
    )
  }

  return (
    <motion.section className="rounded-md border border-leaf-900/20 bg-white p-6 md:p-8" variants={fadeUp}>
      <div className="text-center">
        <h2 className="text-[30px] font-extrabold text-[#4a4f47]">Review Draft Hasil Pengujian</h2>
        <p className="mt-1 font-medium text-[#4d554b]">Periksa dengan teliti hasil analisis sebelum pengesahan akhir.</p>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
        {latestDraft?.link_draft ? (
          <div className="overflow-hidden rounded-md border border-leaf-900/20 bg-[#e9e7df] p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#4d554b]" />
            <p className="mt-4 text-sm font-medium text-[#4d554b]">
              Versi {latestDraft.versi_draft} &middot; Status: {latestDraft.status_draft}
            </p>
            <a
              className="mt-4 inline-flex min-h-[40px] items-center gap-2 rounded bg-leaf-800 px-5 text-xs font-extrabold tracking-[0.08em] text-white transition-colors hover:bg-leaf-900"
              href={latestDraft.link_draft}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="h-4 w-4" /> Buka Draft
            </a>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-leaf-900/20 bg-[#e9e7df] p-8 text-center text-[#4d554b]">
            Draft belum tersedia.
          </div>
        )}
        <div className="grid content-start gap-8">
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <ActionCard icon={CheckCircle2} title="Setujui Draft" text="Draft sudah sesuai dengan kebutuhan. Lanjutkan ke proses pengesahan dokumen final yang ditandatangani." button="Lanjutkan ke Pengesahan" primary onAction={handleApprove} loading={approving} />
          <ActionCard icon={PenLine} title="Minta Revisi" text="Terdapat kesalahan pada data parameter, identitas, atau hasil analisis? Hubungi admin untuk perbaikan." button="Ajukan Catatan Revisi" onAction={handleRevisi} loading={revising} />
        </div>
      </div>
    </motion.section>
  )
}

function ActionCard({ icon: Icon, title, text, button, primary = false, onAction, loading = false }) {
  return (
    <div className="rounded-md border border-leaf-900/20 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${primary ? 'bg-[#c8f2bd] text-leaf-900' : 'bg-[#e6e4dc] text-[#4a4f47]'}`}><Icon className="h-5 w-5" /></span>
        <h3 className="text-2xl font-extrabold text-[#222820]">{title}</h3>
      </div>
      <p className="mt-6 text-sm font-medium leading-7 text-[#4d554b]">{text}</p>
      {button && (
        <button className={`mt-6 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded px-4 text-xs font-extrabold tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50 ${primary ? 'bg-leaf-800 text-white hover:bg-leaf-900' : 'border border-leaf-900/20 bg-white text-[#4a4f47] hover:bg-leaf-50'}`} type="button" disabled={loading} onClick={onAction}>
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
      <p className="mx-auto mt-3 max-w-xl text-base font-medium text-white/80">Sertifikat Anda sudah siap. Silakan isi kuesioner kepuasan singkat untuk membuka akses unduh sertifikat.</p>
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
  return (
    <motion.div className="grid gap-8" variants={staggerContainer}>
      <motion.section className="rounded-md bg-leaf-800 p-7 text-white md:p-8" variants={fadeUp}>
        <div className="flex gap-4">
          <CheckCircle2 className="mt-1 h-7 w-7 shrink-0 text-leaf-200" />
          <div>
            <h2 className="text-[30px] font-extrabold">Pengujian Selesai!</h2>
            <p className="mt-3 max-w-4xl text-base font-medium leading-7 text-white/72">Sertifikat Hasil Uji (SHU) untuk sampel Anda telah diterbitkan dan siap untuk diunduh. Terima kasih telah mempercayakan pengujian kepada Lab KTNT UNPAD.</p>
          </div>
        </div>
      </motion.section>
      <motion.section className="grid gap-6 lg:grid-cols-[425px_1fr]" variants={fadeUp}>
        <div className="rounded-md border border-leaf-900/20 bg-white p-6">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4d554b]">Detail Pengujian</h3>
          <div className="mt-6 grid gap-5 text-base">
            <Info label="Nomor Order" value={order.kode_tracking} />
            <Info label="Jenis Analisis" value={order.jenis_analisis_sampel} />
            <div className="h-px bg-leaf-900/15" />
            <Info label="Tanggal Terbit" value={formatTanggal(certificate?.tanggal_terbit)} />
          </div>
        </div>
        <div className="rounded-md border border-leaf-900/20 bg-[#f4f3ee] p-6 text-center">
          <div className="mx-auto grid min-h-[335px] max-w-[240px] place-items-center border border-leaf-900/20 bg-[#f1f0ea] px-6">
            <span className="grid h-12 w-12 place-items-center rounded-xl border-2 border-leaf-900"><FileText className="h-6 w-6" /></span>
          </div>
          {certificate?.link_sertifikat ? (<a
            
              className="mx-auto mt-7 inline-flex min-h-[48px] w-full max-w-[380px] items-center justify-center gap-3 rounded-lg bg-leaf-900 px-6 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-800"
              href={certificate.link_sertifikat}
              target="_blank"
              rel="noreferrer"
            >
              <Download className="h-5 w-5" /> Download Sertifikat PDF
            </a>
          ) : (
            <p className="mt-7 text-sm font-medium text-[#4d554b]">Link sertifikat belum tersedia.</p>
          )}
        </div>
      </motion.section>
      <motion.section className="mx-auto max-w-[520px] border-t border-leaf-900/20 pt-8 text-center" variants={fadeUp}>
        <Flower2 className="mx-auto h-9 w-9 text-leaf-700" />
        <h2 className="mt-3 text-2xl font-extrabold text-leaf-900">Terima Kasih</h2>
        <p className="mt-3 font-medium leading-7 text-[#4d554b]">Kami berharap hasil analisis ini dapat berkontribusi positif bagi penelitian atau pengelolaan lahan pertanian Anda.</p>
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

  const { order, history, certificate, survey_completed: surveyCompleted, latest_draft: latestDraft } = data
  const status = order.current_status
  const lastLog = history[history.length - 1]

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
            <p className="mt-2 font-medium text-[#4d554b]">Lacak progres analisis sampel tanah Anda secara real-time.</p>
          </motion.div>
          <div className="mt-12 grid gap-12">
            <SampleSummary order={order} />

            {status === 'PEMBAYARAN' && <PaymentReview kodeTracking={kodeTracking} invoiceUrl={order.invoice_file_url} />}
            {status === 'REVIEW_DRAFT' && <DraftPreview kodeTracking={kodeTracking} latestDraft={latestDraft} onRefresh={refreshData} />}
            {['SAMPEL_DITERIMA', 'PROSES_ANALISIS', 'INPUT_DATA_HASIL', 'PENGESAHAN'].includes(status) && (
              <Notice
                title={noticeContent[status]?.title}
                text={noticeContent[status]?.text}
                updatedAt={lastLog?.created_at}
              />
            )}
            {status === 'DOWNLOAD_SERTIFIKAT' && (
              surveyCompleted
                ? <ReadyDownload order={order} certificate={certificate} />
                : <SurveyPrompt kodeTracking={kodeTracking} onNavigate={onNavigate} />
            )}
          </div>
        </motion.div>
      </main>
      <Footer compact />
    </>
  )
}