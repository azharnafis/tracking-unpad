import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Award,
  Building2,
  ClipboardCheck,
  ExternalLink,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
} from 'lucide-react'
import { AnimatedSection, fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import {
  contactInfo,
  googleMapsEmbedUrl,
  googleMapsUrl,
  labSlides,
  serviceCategories,
  services,
} from '../data/siteData'

function InstagramIcon({ className = 'h-4 w-4', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function HeroSection({ onNavigate }) {
  return (
    <section className="hero-bg relative isolate flex min-h-[720px] items-center overflow-hidden px-5 py-20 text-white sm:px-8 md:min-h-[780px] lg:min-h-[870px] lg:px-12 xl:px-16">
      <div className="mx-auto w-full max-w-[1280px]">
        <motion.div
          className="max-w-[880px]"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Eyebrow */}
          <motion.p
            className="text-2xl sm:text-3xl lg:text-[40px] font-bold text-white tracking-[0.02em] leading-tight"
            variants={fadeUp}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            Dear Customer,
          </motion.p>

          {/* Heading */}
          <motion.h1
            className="mt-2 text-4xl font-extrabold leading-[1.08] tracking-[-0.01em] sm:text-6xl lg:text-[76px] xl:text-[80px] text-white"
            variants={fadeUp}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            Pantau Proses Pengujian Sampel Anda, Real-Time &amp; Transparan
          </motion.h1>

          {/* Badges Strip */}
          <motion.div
            className="mt-8 mb-10 inline-flex flex-wrap items-center gap-4 sm:gap-6 rounded-2xl sm:rounded-full border border-white/20 bg-white/10 px-5 py-3.5 backdrop-blur-md"
            variants={fadeUp}
            transition={{ duration: 0.65, ease: 'easeOut' }}
          >
            {/* Badge 1 */}
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FBEF6F]">
                <Award className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FBEF6F]">
                  TERAKREDITASI
                </span>
                <span className="block text-xs font-normal text-white/80">
                  SNI ISO/IEC 17025:2017
                </span>
              </div>
            </div>

            <div className="hidden h-9 w-[1px] bg-white/20 sm:block" />

            {/* Badge 2 */}
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FBEF6F]">
                <Building2 className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FBEF6F]">
                  DITUNJUK
                </span>
                <span className="block text-xs font-normal text-white/80">
                  Kementerian Pertanian RI
                </span>
              </div>
            </div>

            <div className="hidden h-9 w-[1px] bg-white/20 sm:block" />

            {/* Badge 3 */}
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-white/10 text-[#FBEF6F]">
                <ShieldCheck className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div>
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#FBEF6F]">
                  SDM TERSERTIFIKASI
                </span>
                <span className="block text-xs font-normal text-white/80">
                  &amp; Alat Terkalibrasi
                </span>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="flex flex-col gap-4 sm:flex-row items-stretch sm:items-center"
            variants={fadeUp}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <motion.button
              type="button"
              className="inline-flex min-h-[48px] sm:min-h-[52px] items-center justify-center gap-2.5 rounded-full bg-[#FBEF6F] px-8 text-sm font-bold text-[#4F3D00] shadow-sm transition-colors duration-200 hover:bg-[#faea50]"
              onClick={() => onNavigate('tracking')}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ClipboardCheck className="h-4 w-4 text-[#4F3D00]" strokeWidth={2.5} />
              Cek Status Pengujian
            </motion.button>

            <motion.a
              className="inline-flex min-h-[48px] sm:min-h-[52px] items-center justify-center rounded-full border border-white/40 bg-white/10 px-8 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-200 hover:bg-white/20"
              href="#layanan"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Lihat Layanan Kami
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function ProfilSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % labSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <AnimatedSection
      className="relative z-10 -mt-10 sm:-mt-12 rounded-t-[40px] sm:rounded-t-[50px] border border-[#E5E1D9] bg-[#FBFCF7] px-5 py-14 shadow-[0_8px_30px_rgba(74,92,58,0.15)] sm:px-8 md:py-20 lg:px-12 xl:px-16"
      id="profil"
    >
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Left Column: Information & Description */}
        <div>
          <h2 className="mb-6 text-3xl font-bold leading-tight text-[#334425] sm:text-4xl">
            Laboratorium Kimia Tanah dan Nutrisi Tanaman
          </h2>

          <p className="mb-4 text-base font-normal leading-relaxed text-[#44483F] sm:text-lg">
            Laboratorium Kimia Tanah dan Nutrisi Tanaman (Lab KTNT), Fakultas Pertanian,Universitas Padjadjaran, merupakan laboratorium pengujian yang telah terakreditasi SNI ISO/IEC 17025:2017 dan ditunjuk oleh Kementerian Pertanian Republik Indonesia.
          </p>

          <p className="mb-8 text-base font-normal leading-relaxed text-[#44483F] sm:text-lg">
            Kami melayani pengujian pupuk, pembenah tanah, tanah, dan tanaman, didukung oleh metode terstandar, sumber daya tersertifikasi, dan peralatan terkalibrasi.
          </p>

          <a
            href={contactInfo.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 text-base font-normal text-[#44483F] transition-colors duration-200 hover:text-[#1D1C17] group"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#E5E1D9] bg-white text-[#44483F] shadow-sm transition-transform group-hover:scale-105">
              <InstagramIcon className="h-4 w-4" />
            </span>
            <span className="font-medium">{contactInfo.instagramUsername}</span>
          </a>
        </div>

        {/* Right Column: Slide Photo with Dots */}
        <div className="flex flex-col items-center">
          <div className="relative aspect-[16/11] w-full overflow-hidden rounded-xl border border-[#E5E1D9] bg-white shadow-sm sm:rounded-2xl">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                src={labSlides[currentSlide].image}
                alt={labSlides[currentSlide].caption}
                className="h-full w-full object-cover"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            </AnimatePresence>
          </div>

          {/* Pagination Dots */}
          <div className="mt-4 flex items-center justify-center gap-2">
            {labSlides.map((slide, idx) => (
              <button
                type="button"
                key={slide.image}
                className={`h-3 w-3 rounded-full transition-all duration-300 ${
                  currentSlide === idx
                    ? 'w-6 bg-[#C4EAB6]'
                    : 'bg-black/20 hover:bg-black/30'
                }`}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

function KategoriLayananSection() {
  return (
    <AnimatedSection className="bg-[#FBFCF7] px-5 py-14 sm:px-8 md:py-20 lg:px-12 xl:px-16">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1D1C17] sm:text-4xl">
            Kategori Layanan Utama
          </h2>
          <p className="mt-2 text-base font-normal text-[#44483F]">
            Solusi komprehensif untuk kebutuhan analisis dan riset pertanian Anda.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {serviceCategories.map((cat) => {
            const Icon = cat.icon
            return (
              <motion.article
                key={cat.title}
                className="group flex flex-col overflow-hidden rounded-xl border border-[#E5E1D9] bg-white transition-all duration-300 hover:shadow-md"
                variants={fadeUp}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
              >
                {/* Photo Top (170px height) */}
                <div className="h-[170px] w-full overflow-hidden bg-gray-100">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Floating Round Icon */}
                <div className="relative px-6">
                  <div
                    className="-mt-6 grid h-12 w-12 place-items-center rounded-full shadow-sm"
                    style={{ backgroundColor: cat.iconBg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: cat.iconColor }} strokeWidth={2.2} />
                  </div>
                </div>

                {/* Card Content */}
                <div className="flex flex-1 flex-col p-6 pt-4">
                  <h3 className="mb-2 text-2xl font-semibold leading-snug text-[#1D1C17]">
                    {cat.title}
                  </h3>
                  <p className="text-base font-normal leading-normal text-[#44483F]">
                    {cat.description}
                  </p>
                </div>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function ServicesSection() {
  return (
    <AnimatedSection
      className="bg-[#FBFCF7] px-5 py-14 sm:px-8 md:py-20 lg:px-12 xl:px-16"
      id="layanan"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-12 max-w-[680px] text-center">
          <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#334425]">
            LAYANAN ANALISIS
          </span>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1D1C17] sm:text-4xl">
            Jasa Pelayanan &amp; Parameter Pengujian
          </h2>
          <p className="mt-2 text-base font-normal text-[#44483F]">
            Kami menyediakan berbagai layanan analisis laboratorium berkualitas tinggi untuk sampel alam dan produk pertanian.
          </p>
        </div>

        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {services.map((service) => (
            <motion.article
              className="flex min-h-[140px] items-start gap-4 rounded-lg border border-[#B8CDA3] bg-[#D5DBB0]/25 p-5 transition-colors duration-200 hover:bg-[#D5DBB0]/40"
              key={service.number}
              variants={fadeUp}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -2 }}
            >
              <span className="shrink-0 font-extrabold text-5xl leading-none text-[#334425]/20 select-none">
                {service.number}
              </span>
              <div className="flex-1">
                <h3 className="text-xl font-semibold leading-snug text-[#1D1C17] mb-1">
                  {service.title}
                </h3>
                <p className="text-sm font-normal leading-snug text-[#44483F]">
                  {service.description}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function ContactSection() {
  return (
    <AnimatedSection className="bg-white px-5 py-14 sm:px-8 md:py-20 lg:px-12 xl:px-16" id="kontak">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 rounded-xl border border-[#E0D9CE] bg-[#FFFEE5] p-8 shadow-sm sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:p-12">
          {/* Left Side: Contact Information */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="mb-8 text-3xl font-normal text-[#243F26] sm:text-4xl">
                Hubungi Kami
              </h2>

              <div className="space-y-6 mb-8">
                {/* ALAMAT */}
                <div className="flex items-start gap-3.5">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#755B00]" strokeWidth={2.2} />
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wider text-[#243F26] mb-1">
                      ALAMAT
                    </strong>
                    <p className="text-base font-normal leading-relaxed text-[#243F26]">
                      {contactInfo.addressLines.map((line, i) => (
                        <span key={i} className="block">{line}</span>
                      ))}
                    </p>
                  </div>
                </div>

                {/* EMAIL */}
                <div className="flex items-start gap-3.5">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[#755B00]" strokeWidth={2.2} />
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wider text-[#243F26] mb-1">
                      EMAIL
                    </strong>
                    <p className="text-base font-normal leading-relaxed text-[#243F26]">
                      {contactInfo.emails.map((email, i) => (
                        <a
                          key={i}
                          href={`mailto:${email}`}
                          className="block hover:underline"
                        >
                          {email}
                        </a>
                      ))}
                    </p>
                  </div>
                </div>

                {/* TELEPON / WA */}
                <div className="flex items-start gap-3.5">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#755B00]" strokeWidth={2.2} />
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wider text-[#243F26] mb-1">
                      TELEPON / WA
                    </strong>
                    <p className="text-base font-normal leading-relaxed text-[#243F26]">
                      {contactInfo.phoneDisplay}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp CTA Button */}
            <div>
              <motion.a
                className="inline-flex min-h-[44px] items-center justify-center gap-2.5 rounded bg-[#FBEF6F] px-6 text-xs font-semibold uppercase tracking-wider text-[#243F26] transition-colors duration-200 hover:bg-[#faea50] shadow-sm"
                href={contactInfo.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MessageSquare className="h-4 w-4 text-[#243F26]" strokeWidth={2.5} />
                Hubungi via WhatsApp
              </motion.a>
            </div>
          </div>

          {/* Right Side: Interactive Google Map */}
          <div className="relative min-h-[340px] lg:min-h-[400px] w-full overflow-hidden rounded-lg border border-[#E0D9CE] bg-[#E2E8F0] shadow-sm">
            <iframe
              className="absolute inset-0 h-full w-full border-0"
              src={googleMapsEmbedUrl}
              title="Lokasi Laboratorium Kimia Tanah dan Nutrisi Tanaman UNPAD"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#243F26] shadow transition-colors hover:bg-white"
              aria-label="Buka di Google Maps"
            >
              <span>Buka di Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </AnimatedSection>
  )
}

export function HomePage({ onNavigate }) {
  return (
    <>
      <main id="beranda">
        <HeroSection onNavigate={onNavigate} />
        <ProfilSection />
        <KategoriLayananSection />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}