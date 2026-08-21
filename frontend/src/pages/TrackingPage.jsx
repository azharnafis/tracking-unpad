import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, ScanLine } from 'lucide-react'
import { fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { processSteps, sampleFlowCards } from '../data/siteData'

function SearchPanel({ onNavigate }) {
  const [kodeTracking, setKodeTracking] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const trimmed = kodeTracking.trim()
    if (!trimmed) return
    onNavigate('status', trimmed)
  }

  return (
    <section className="bg-leaf-50 px-5 pb-24 pt-20 sm:px-8 md:pb-28 md:pt-24 lg:px-12">
      <motion.div className="mx-auto max-w-[820px] text-center" initial="hidden" animate="visible" variants={staggerContainer}>
        <motion.h1 className="text-[36px] font-extrabold leading-tight tracking-[-0.02em] text-[#454b43] sm:text-5xl lg:text-[52px]" variants={fadeUp} transition={{ duration: 0.5 }}>Pantau Status Pengujian Sampelmu</motion.h1>
        <motion.p className="mx-auto mt-5 max-w-[720px] text-base font-medium leading-8 text-[#4d554b] sm:text-lg" variants={fadeUp} transition={{ duration: 0.5 }}>Sistem pelacakan real-time untuk memantau perjalanan sampel tanah dan tanaman Anda di Laboratorium Kimia, Fisika, dan Biologi Tanah Fakultas Pertanian UNPAD.</motion.p>

        <motion.form className="mx-auto mt-9 flex max-w-[670px] flex-col overflow-hidden rounded-md border border-leaf-900/20 bg-white shadow-sm sm:flex-row" onSubmit={handleSubmit} variants={fadeUp} transition={{ duration: 0.5 }}>
          <label className="flex min-h-[62px] flex-1 items-center gap-4 px-5 text-left">
            <ScanLine className="h-6 w-6 shrink-0 text-[#686f65]" aria-hidden="true" />
            <span className="sr-only">Kode tracking sampel</span>
            <input
              className="w-full border-0 bg-transparent text-base font-medium text-leaf-900 outline-none placeholder:text-[#b5b8ae]"
              placeholder="Masukkan Kode Tracking (contoh: LAB-2026-0001)"
              name="trackingCode"
              value={kodeTracking}
              onChange={(event) => setKodeTracking(event.target.value)}
            />
          </label>
          <motion.button className="m-2 inline-flex min-h-[48px] items-center justify-center gap-2 rounded bg-leaf-800 px-5 text-xs font-extrabold tracking-[0.08em] text-white transition-colors duration-200 hover:bg-leaf-900" type="submit" whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
            <Search className="h-5 w-5" aria-hidden="true" />
            Lacak Sekarang
          </motion.button>
        </motion.form>
      </motion.div>
    </section>
  )
}

function ProcessSection() {
  return (
    <section className="relative -mt-8 bg-leaf-200 px-5 py-16 sm:px-8 md:-mt-10 md:py-24 lg:px-10">
      <div className="mx-auto max-w-[1200px] text-center">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} transition={{ duration: 0.5 }}>
          <h2 className="text-[30px] font-extrabold tracking-[-0.01em] text-leaf-900 md:text-[34px]">Alur Proses Laboratorium</h2>
          <p className="mt-3 text-base font-medium text-[#46503e]">Standar operasional prosedur pengujian sampel di Lab KTNT</p>
        </motion.div>

        <motion.div className="relative mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-7 lg:gap-4" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={staggerContainer}>
          <div className="absolute left-0 right-0 top-8 hidden h-px bg-leaf-900/15 lg:block" />
          {processSteps.map((step) => {
            const Icon = step.icon
            return (
              <motion.article className="relative z-10 rounded bg-leaf-200 px-2 py-2" key={step.status} variants={fadeUp} transition={{ duration: 0.45 }} whileHover={{ y: -5 }}>
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-lg border border-leaf-900/15 bg-leaf-50 text-leaf-900 shadow-sm">
                  <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-sm font-extrabold text-[#222820]">{step.number}. {step.title}</h3>
                <p className="mt-2 text-sm font-medium text-[#4d554b]">{step.description}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function WorkflowCards() {
  return (
    <section className="bg-leaf-50 px-5 py-14 sm:px-8 lg:px-10">
      <motion.div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-3" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={staggerContainer}>
        {sampleFlowCards.map((card) => {
          const Icon = card.icon
          return (
            <motion.article className="border border-leaf-900/10 bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-soft" key={card.title} variants={fadeUp} whileHover={{ y: -4 }}>
              <span className="grid h-11 w-11 place-items-center bg-leaf-100 text-leaf-900">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-lg font-extrabold text-leaf-900">{card.title}</h3>
              <p className="mt-3 text-sm font-medium leading-7 text-[#596150]">{card.description}</p>
            </motion.article>
          )
        })}
      </motion.div>
    </section>
  )
}

export function TrackingPage({ onNavigate }) {
  return (
    <>
      <main>
        <SearchPanel onNavigate={onNavigate} />
        <ProcessSection />
        <WorkflowCards />
      </main>
      <Footer compact />
    </>
  )
}