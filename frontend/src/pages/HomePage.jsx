import { motion } from 'framer-motion'
import { Mail, MapPin, MessageSquare, Phone } from 'lucide-react'
import { AnimatedSection, fadeUp, staggerContainer } from '../components/AnimatedSection'
import { Footer } from '../components/Footer'
import { googleMapsEmbedUrl, googleMapsUrl, services } from '../data/siteData'

function HeroSection({ onNavigate }) {
  return (
    <section className="hero-bg relative isolate flex min-h-[620px] items-center overflow-hidden px-5 py-20 text-white sm:px-8 md:min-h-[650px] lg:min-h-[760px] lg:px-12 xl:px-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[rgba(38,67,30,.92)] via-[rgba(48,78,38,.68)] to-[rgba(48,78,38,.24)]" />
      <motion.div className="mx-auto w-full max-w-[1180px]" initial="hidden" animate="visible" variants={staggerContainer}>
        <motion.div className="max-w-[760px]" variants={fadeUp} transition={{ duration: 0.55, ease: 'easeOut' }}>
          <h1 className="text-[34px] font-extrabold leading-[1.18] tracking-[-0.01em] sm:text-5xl lg:text-[64px]">Analisis Tanah &amp; Nutrisi Tanaman dengan Standar Ilmiah Tertinggi</h1>
          <p className="mt-6 max-w-[720px] text-[15px] font-semibold leading-7 text-white/78 sm:text-lg">Laboratorium Ilmu Tanah dan Nutrisi Tanaman (Lab KTNT) Faperta UNPAD menyediakan analisis komprehensif untuk mengoptimalkan kesuburan lahan Anda. Kini, Anda dapat memantau seluruh proses pengujian sampel secara real-time dan transparan.</p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <motion.button type="button" className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-sun px-7 text-sm font-extrabold text-[#40511f] shadow-sm transition-colors duration-200 hover:bg-[#ffef7a]" onClick={() => onNavigate('tracking')} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Cek Status Pengujian
            </motion.button>
            <motion.a className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/55 px-7 text-sm font-extrabold text-white transition-colors duration-200 hover:bg-white/10" href="#layanan" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
              Lihat Layanan Kami
            </motion.a>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function ServicesSection() {
  return (
    <AnimatedSection className="relative z-10 -mt-8 rounded-t-[28px] bg-leaf-50 px-5 pb-16 pt-12 sm:px-8 md:-mt-10 lg:px-12 lg:pb-20 xl:px-16" id="layanan">
      <div className="mx-auto max-w-[1180px]">
        <div className="mx-auto mb-9 max-w-[960px] text-center">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.38em] text-[#6d742d]">Layanan Analisis</span>
          <h2 className="mt-2 text-[28px] font-extrabold leading-tight tracking-[-0.01em] text-leaf-900 md:text-[34px]">Jasa Pelayanan &amp; Parameter Pengujian</h2>
          <p className="mt-2 font-bold leading-7 text-[#60705c]">Kami menyediakan berbagai layanan analisis laboratorium berkualitas tinggi untuk sampel alam dan produk pertanian;</p>
        </div>
        <motion.div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.12 }}>
          {services.map((service) => {
            const Icon = service.icon
            return (
              <motion.article className="group min-h-[236px] bg-leaf-200 px-7 py-8 transition-colors duration-200 hover:bg-[#dfe6b6] md:min-h-[282px] md:px-8 md:py-9" key={service.title} variants={fadeUp} transition={{ duration: 0.45, ease: 'easeOut' }} whileHover={{ y: -6 }}>
                <span className="mb-7 grid h-12 w-12 place-items-center bg-leaf-50 text-[#333827] shadow-sm transition-transform duration-200 group-hover:scale-105">
                  <Icon className="h-6 w-6" strokeWidth={2.2} aria-hidden="true" />
                </span>
                <h3 className="text-[22px] font-extrabold leading-tight text-leaf-900 md:text-2xl">{service.title}</h3>
                <p className="mt-4 font-semibold leading-7 text-[#586d4f]">{service.description}</p>
              </motion.article>
            )
          })}
        </motion.div>
      </div>
    </AnimatedSection>
  )
}

function ContactSection() {
  return (
    <AnimatedSection className="bg-leaf-200 px-5 py-16 sm:px-8 md:py-20 lg:px-12 xl:px-16" id="kontak">
      <div className="mx-auto grid max-w-[1180px] items-center gap-12 md:grid-cols-[minmax(300px,460px)_minmax(340px,1fr)] lg:gap-28">
        <div>
          <h2 className="mb-10 text-[32px] font-extrabold text-leaf-900 md:mb-12 md:text-[34px]">Hubungi Kami</h2>
          <div className="mb-10 grid gap-7 md:mb-12">
            <ContactItem icon={MapPin} title="Alamat">Gedung Departemen Tanah, Faperta UNPAD<br />Jl. Raya Bandung Sumedang KM. 21, Jatinangor</ContactItem>
            <ContactItem icon={Mail} title="Email">lab.ktnt@unpad.ac.id</ContactItem>
            <ContactItem icon={Phone} title="Telepon / WA">+62 22 779 6316</ContactItem>
          </div>
          <motion.a className="inline-flex min-h-[52px] w-full max-w-[260px] items-center justify-center gap-3 rounded bg-sun px-5 text-xs font-extrabold tracking-[0.08em] text-[#40511f] transition-colors duration-200 hover:bg-[#ffef7a]" href="https://wa.me/62227796316" target="_blank" rel="noreferrer" whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.98 }}>
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            Hubungi via WhatsApp
          </motion.a>
        </div>
        <motion.a className="relative block min-h-[320px] overflow-hidden rounded-[7px] bg-[#aeb3b5] shadow-soft md:min-h-[420px]" href={googleMapsUrl} target="_blank" rel="noreferrer" whileHover={{ scale: 1.01 }} transition={{ duration: 0.25 }} aria-label="Buka lokasi Lab KTNT UNPAD di Google Maps">
          {googleMapsEmbedUrl ? (
            <iframe className="pointer-events-none absolute inset-0 h-full w-full" src={googleMapsEmbedUrl} title="Google Maps Lab KTNT UNPAD" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
          ) : (
            <>
              <div className="absolute inset-0 map-fallback" />
              <div className="absolute left-1/2 top-1/2 grid h-[76px] w-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded bg-leaf-900 text-xs font-extrabold tracking-[0.12em] text-white shadow-lg">
                <MapPin className="h-6 w-6" fill="currentColor" aria-hidden="true" />
                Lab KTNT
              </div>
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs font-extrabold text-leaf-900 shadow">Buka Google Maps</span>
            </>
          )}
        </motion.a>
      </div>
    </AnimatedSection>
  )
}

function ContactItem({ icon: Icon, title, children }) {
  return (
    <div className="grid grid-cols-[34px_1fr] gap-3">
      <Icon className="mt-1 h-5 w-5 text-soil" strokeWidth={2.3} aria-hidden="true" />
      <div>
        <strong className="mb-1 block text-xs font-extrabold uppercase tracking-[0.22em] text-leaf-800">{title}</strong>
        <p className="m-0 font-semibold leading-7 text-[#45603e]">{children}</p>
      </div>
    </div>
  )
}

export function HomePage({ onNavigate }) {
  return (
    <>
      <main id="beranda">
        <HeroSection onNavigate={onNavigate} />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}