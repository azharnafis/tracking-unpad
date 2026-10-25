import { motion } from 'framer-motion'

export function Logo({ onClick }) {
  return (
    <motion.button
      type="button"
      className="group flex items-center gap-3 sm:gap-4 text-left"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      aria-label="Beranda Lab KTNT UNPAD"
    >
      <img
        src="/assets/images/logolab.png"
        alt="Logo Lab KTNT UNPAD"
        className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:opacity-90"
        style={{ aspectRatio: '257 / 97' }}
      />
      <img
        src="/assets/images/logokan.png"
        alt="Logo Komite Akreditasi Nasional (KAN)"
        className="h-10 sm:h-12 w-auto object-contain transition-transform duration-200 group-hover:opacity-90"
        style={{ aspectRatio: '181 / 94' }}
      />
    </motion.button>
  )
}