import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, FileText, Loader2, SendHorizontal, Star } from 'lucide-react'
import { fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { getSurveyContext, submitSurvey } from '../services/api'

const SURVEY_SECTIONS = [
  {
    id: 'I',
    title: 'Bagian I — Prosedur dan Pelayanan Awal',
    description: 'Penilaian terhadap kemudahan pendaftaran dan kejelasan prosedur pengujian.',
    questions: [
      {
        key: 'q01',
        text: 'Kecepatan dan kemudahan dalam proses pendaftaran atau penerimaan sampel pengujian.',
      },
      {
        key: 'q02',
        text: 'Kejelasan informasi mengenai prosedur pengujian, persyaratan sampel, dan estimasi waktu kerja.',
      },
      {
        key: 'q03',
        text: 'Ketepatan waktu dalam penerbitan invoice serta kejelasan rincian biaya pengujian.',
      },
      {
        key: 'q04',
        text: 'Kemudahan dan keteraturan proses administrasi layanan laboratorium secara keseluruhan.',
      },
    ],
  },
  {
    id: 'II',
    title: 'Bagian II — Komunikasi dan Pelayanan Petugas',
    description: 'Penilaian terhadap responsivitas dan sikap profesionalisme staf laboratorium.',
    questions: [
      {
        key: 'q05',
        text: 'Keramahan, kesopanan, dan profesionalisme petugas laboratorium dalam melayani Anda.',
      },
      {
        key: 'q06',
        text: 'Kemudahan dan keterbukaan dalam melakukan konsultasi teknis terkait parameter pengujian.',
      },
      {
        key: 'q07',
        text: 'Kecepatan dan ketanggapan petugas dalam merespons pertanyaan maupun kebutuhan tindak lanjut.',
      },
    ],
  },
  {
    id: 'III',
    title: 'Bagian III — Fasilitas dan Sistem Pelacakan',
    description: 'Penilaian terhadap platform tracking online dan kualitas draft dokumen hasil.',
    questions: [
      {
        key: 'q08',
        text: 'Kemudahan dalam mengakses dan menggunakan website sistem pelacakan (tracking) status sampel.',
      },
      {
        key: 'q09',
        text: 'Kejelasan dan keakuratan pembaruan (update) status tahapan pengujian sampel Anda.',
      },
      {
        key: 'q10',
        text: 'Ketepatan waktu penyelesaian proses analisis laboratorium sesuai dengan estimasi yang diberikan.',
      },
      {
        key: 'q11',
        text: 'Kualitas penyajian, kerapian, dan kelengkapan data dalam draft hasil pengujian.',
      },
      {
        key: 'q12',
        text: 'Kejelasan tata letak, format penulisan, dan informasi pada dokumen hasil pengujian.',
      },
      {
        key: 'q13',
        text: 'Tingkat kepuasan Anda secara menyeluruh terhadap pelayanan Laboratorium KTNT UNPAD.',
      },
    ],
  },
  {
    id: 'IV',
    title: 'Bagian IV — Akurasi dan Keandalan Hasil Uji',
    description: 'Penilaian mutu teknis dan keandalan data hasil pengujian laboratorium.',
    questions: [
      {
        key: 'q14',
        text: 'Akurasi, presisi, dan keandalan data hasil analisis pengujian sampel laboratorium.',
      },
    ],
  },
]

const SCALE_LABELS_PUAS = {
  5: 'Sangat Puas',
  4: 'Puas',
  3: 'Cukup Puas / Biasa',
  2: 'Tidak Puas',
  1: 'Sangat Tidak Puas',
}

const SCALE_LABELS_BAIK = {
  5: 'Sangat Baik',
  4: 'Baik',
  3: 'Cukup Puas / Biasa',
  2: 'Tidak Puas',
  1: 'Sangat Tidak Puas',
}

function RatingRow({ qKey, number, questionText, isBaikScale, value, onChange }) {
  const labels = isBaikScale ? SCALE_LABELS_BAIK : SCALE_LABELS_PUAS
  const activeLabel = value > 0 ? labels[value] : ''

  return (
    <div className="border-b border-leaf-900/10 py-5 last:border-b-0">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-sm font-semibold leading-relaxed text-[#222820]">
            <span className="font-extrabold text-leaf-900">{number}. </span>
            {questionText}
          </p>
          {activeLabel && (
            <span className="mt-1 inline-block text-xs font-bold text-leaf-800">
              Pilihan: {activeLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label={`Rating pertanyaan ${number}`}>
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => onChange(qKey, score)}
              className={`grid h-9 w-9 place-items-center rounded border transition-colors ${
                score <= value
                  ? 'border-[#b9a200] bg-[#fff9db] text-[#b9a200]'
                  : 'border-leaf-900/15 bg-white text-[#b9bdb2] hover:border-[#b9a200] hover:text-[#b9a200]'
              }`}
              title={`${score} Bintang - ${labels[score]}`}
              aria-label={`${score} bintang (${labels[score]})`}
            >
              <Star
                className={`h-5 w-5 ${score <= value ? 'fill-sun text-[#b9a200]' : ''}`}
                strokeWidth={1.8}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ContextHeader({ context }) {
  if (!context) return null
  return (
    <div className="mb-8 rounded-md border border-leaf-900/20 bg-[#f4f3ee] p-5">
      <h3 className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#4d554b]">
        <FileText className="h-4 w-4" /> Informasi Sampel Terkait
      </h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#777b70]">Kode Tracking</p>
          <p className="text-sm font-extrabold text-leaf-900">{context.kode_tracking || '-'}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#777b70]">Nama Perusahaan / Pelanggan</p>
          <p className="text-sm font-extrabold text-leaf-900">{context.nama_perusahaan || '-'}</p>
        </div>
      </div>
    </div>
  )
}

export function SurveyPage({ kodeTracking, onNavigate }) {
  const [context, setContext] = useState(null)
  const [answers, setAnswers] = useState({})
  const [saran, setSaran] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  useEffect(() => {
    if (!kodeTracking) {
      setError('Kode tracking tidak ditemukan. Silakan buka kuesioner dari halaman status sampel.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    getSurveyContext(kodeTracking)
      .then((data) => {
        setContext(data.konteks)
        if (data.sudah_diisi) {
          setAlreadySubmitted(true)
        }
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Gagal memuat kuesioner. Pastikan status sampel telah mencapai tahap Download Sertifikat.')
      })
      .finally(() => setLoading(false))
  }, [kodeTracking])

  function handleRatingChange(key, value) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    // Validate that all 14 questions (q01 to q14) are filled with ratings 1-5
    const missing = []
    for (let i = 1; i <= 14; i++) {
      const key = `q${String(i).padStart(2, '0')}`
      const val = answers[key]
      if (!val || val < 1 || val > 5) {
        missing.push(i)
      }
    }

    if (missing.length > 0) {
      setError(`Silakan lengkapi penilaian untuk seluruh pertanyaan (Pertanyaan No. ${missing.join(', ')} belum diisi).`)
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...answers,
        saran: saran.trim() || null,
      }
      await submitSurvey(kodeTracking, payload)
      onNavigate('status', kodeTracking)
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim kuesioner. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-[60vh] place-items-center bg-leaf-50">
        <div className="flex items-center gap-3 text-leaf-900">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="font-medium">Memuat kuesioner kepuasan pelanggan...</span>
        </div>
      </main>
    )
  }

  if (alreadySubmitted) {
    return (
      <>
        <main className="min-h-[calc(100vh-65px)] bg-leaf-50 px-5 py-14 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[700px] rounded-md border border-green-300 bg-white p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-700" />
            <h1 className="mt-4 text-2xl font-extrabold text-leaf-900">Kuesioner Sudah Diisi</h1>
            <p className="mt-3 text-base text-[#4d554b]">
              Terima kasih! Kuesioner untuk sampel ini telah berhasil dicatat. Anda dapat langsung mengunduh Sertifikat Hasil Uji.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('status', kodeTracking)}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded bg-leaf-800 px-6 text-xs font-extrabold tracking-[0.08em] text-white hover:bg-leaf-900"
            >
              Kembali ke Unduh Sertifikat
            </button>
          </div>
        </main>
        <Footer compact />
      </>
    )
  }

  let questionCounter = 0

  return (
    <>
      <main className="min-h-[calc(100vh-65px)] bg-leaf-50 px-5 py-14 sm:px-8 lg:px-10">
        <motion.form
          className="mx-auto max-w-[860px] rounded-md border border-leaf-900/20 bg-white p-7 md:p-12"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          onSubmit={handleSubmit}
        >
          <motion.div className="text-center" variants={fadeUp}>
            <h1 className="text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900">
              Kuesioner Kepuasan Pelanggan
            </h1>
            <p className="mx-auto mt-3 max-w-[700px] text-base font-medium leading-relaxed text-[#4d554b]">
              Masukan Anda sangat berarti bagi peningkatan mutu layanan Laboratorium Kimia, Fisika, dan Biologi Tanah (KTNT) UNPAD.
              Pengisian kuesioner ini hanya membutuhkan waktu sekitar 1–2 menit, dan akan membuka akses unduh Sertifikat Hasil Uji (SHU).
            </p>
          </motion.div>

          <motion.div className="mt-8" variants={fadeUp}>
            <ContextHeader context={context} />
          </motion.div>

          <div className="space-y-10">
            {SURVEY_SECTIONS.map((section) => (
              <motion.div
                key={section.id}
                className="rounded-md border border-leaf-900/15 bg-white p-6 md:p-7 shadow-sm"
                variants={fadeUp}
              >
                <h2 className="text-lg font-extrabold text-leaf-900">{section.title}</h2>
                <p className="mt-1 text-xs text-[#6e7467]">{section.description}</p>
                <div className="mt-6">
                  {section.questions.map((q) => {
                    questionCounter += 1
                    const currentNumber = questionCounter
                    return (
                      <RatingRow
                        key={q.key}
                        qKey={q.key}
                        number={currentNumber}
                        questionText={q.text}
                        isBaikScale={section.id === 'IV'}
                        value={answers[q.key] || 0}
                        onChange={handleRatingChange}
                      />
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {error && (
            <div className="mt-6 rounded border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <motion.div className="mt-10" variants={fadeUp}>
            <label className="text-xs font-extrabold tracking-[0.12em] text-[#4d554b]" htmlFor="feedback">
              Kritik dan Saran Tambahan (Opsional)
            </label>
            <textarea
              className="mt-3 min-h-[120px] w-full rounded border border-leaf-900/20 bg-white p-4 text-base font-medium outline-none transition-colors placeholder:text-[#8f9589] focus:border-leaf-800"
              id="feedback"
              placeholder="Tuliskan kritik, masukan, atau saran perbaikan Anda untuk Lab KTNT UNPAD di sini..."
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
            />
          </motion.div>

          <motion.div className="mt-10 flex flex-col items-center justify-between gap-4 sm:flex-row" variants={fadeUp}>
            <button
              type="button"
              onClick={() => onNavigate('status', kodeTracking)}
              className="inline-flex min-h-[44px] items-center justify-center rounded border border-leaf-900/20 bg-white px-6 text-xs font-extrabold tracking-[0.08em] text-[#4d554b] hover:bg-leaf-50"
            >
              Kembali ke Status
            </button>
            <button
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl bg-leaf-800 px-8 text-xs font-extrabold tracking-[0.08em] text-white transition-colors hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              type="submit"
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Mengirim Survei...' : (
                <>
                  Kirim Survei &amp; Buka Akses Sertifikat <SendHorizontal className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.div>
        </motion.form>
      </main>
      <Footer compact />
    </>
  )
}