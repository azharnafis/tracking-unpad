import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, SendHorizontal, Star } from 'lucide-react'
import { fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { submitQuestionnaire } from '../services/api'

const questions = [
  'Seberapa puas Anda terhadap kecepatan proses pengujian hingga hasil diterbitkan?',
  'Bagaimana penilaian Anda terhadap kecepatan dan keramahan admin dalam memberikan informasi?',
  'Seberapa jelas informasi mengenai status pengujian dan proses tracking yang diberikan?',
  'Seberapa mudah Anda menggunakan website untuk melacak status pengujian dan mengunduh hasil?',
  'Bagaimana penilaian Anda terhadap kualitas laporan atau sertifikat hasil pengujian?',
  'Secara keseluruhan, seberapa puas Anda terhadap layanan Laboratorium KTNT UNPAD?',
]

function RatingRow({ question, index, value, onChange }) {
  return (
    <div className="grid gap-5 border-b border-leaf-900/10 py-6 md:grid-cols-[1fr_auto] md:items-center">
      <p className="max-w-[500px] text-base font-medium leading-7 text-[#222820]">{question}</p>
      <div className="flex gap-2" role="radiogroup" aria-label={`Rating pertanyaan ${index + 1}`}>
        {[1, 2, 3, 4, 5].map((v) => (
          <button className="text-[#b9bdb2] transition-colors hover:text-[#b9a200]" key={v} type="button" onClick={() => onChange(v)} aria-label={`${v} bintang`}>
            <Star className={`h-7 w-7 ${v <= value ? 'fill-sun text-[#b9a200]' : ''}`} strokeWidth={1.8} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function SurveyPage({ kodeTracking, onNavigate }) {
  const [q1, setQ1] = useState(0)
  const [q2, setQ2] = useState(0)
  const [q3, setQ3] = useState(0)
  const [q4, setQ4] = useState(0)
  const [q5, setQ5] = useState(0)
  const [q6, setQ6] = useState(0)
  const [saran, setSaran] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const ratings = [q1, q2, q3, q4, q5, q6]
  const setRatingFns = [setQ1, setQ2, setQ3, setQ4, setQ5, setQ6]

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (ratings.some((r) => r < 1 || r > 5)) {
      setError('Silakan berikan rating untuk semua pertanyaan sebelum mengirim.')
      return
    }

    setSubmitting(true)
    try {
      await submitQuestionnaire(kodeTracking, { q1, q2, q3, q4, q5, q6, saran })
      onNavigate('status', kodeTracking)
    } catch {
      setError('Gagal mengirim survei. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <main className="min-h-[calc(100vh-65px)] bg-leaf-50 px-5 py-14 sm:px-8 lg:px-10">
        <motion.form className="mx-auto max-w-[800px] rounded-md border border-leaf-900/20 bg-white p-7 md:p-12" initial="hidden" animate="visible" variants={staggerContainer} onSubmit={handleSubmit}>
          <motion.div className="text-center" variants={fadeUp}>
            <h1 className="text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900">Bagikan Pengalaman Anda</h1>
            <p className="mx-auto mt-4 max-w-[660px] text-base font-medium leading-7 text-[#4d554b]">Masukan Anda sangat berarti bagi kami untuk meningkatkan kualitas layanan Laboratorium KTNT UNPAD. Survei ini hanya membutuhkan waktu sekitar 1 menit. Setelah survei dikirim, Anda dapat langsung mengunduh sertifikat hasil pengujian.</p>
          </motion.div>

          <motion.div className="mt-9" variants={fadeUp}>
            {questions.map((question, index) => (
              <RatingRow question={question} index={index} key={question} value={ratings[index]} onChange={setRatingFns[index]} />
            ))}
          </motion.div>

          {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

          <motion.div className="mt-10" variants={fadeUp}>
            <label className="text-xs font-extrabold tracking-[0.12em] text-[#4d554b]" htmlFor="feedback">Saran atau masukan (opsional)</label>
            <textarea className="mt-3 min-h-[130px] w-full rounded border border-leaf-900/20 bg-white p-4 text-base font-medium outline-none transition-colors placeholder:text-[#8f9589] focus:border-leaf-800" id="feedback" placeholder="Tuliskan saran Anda di sini..." value={saran} onChange={(e) => setSaran(e.target.value)} />
          </motion.div>

          <motion.div className="mt-10 flex justify-end" variants={fadeUp}>
            <button className="inline-flex min-h-[44px] w-full items-center justify-center gap-3 rounded-xl bg-leaf-800 px-7 text-xs font-extrabold tracking-[0.08em] text-white transition-colors hover:bg-leaf-900 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Mengirim...' : <>Kirim Survei &amp; Unduh Sertifikat <SendHorizontal className="h-4 w-4" /></>}
            </button>
          </motion.div>
        </motion.form>
      </main>
      <Footer compact />
    </>
  )
}