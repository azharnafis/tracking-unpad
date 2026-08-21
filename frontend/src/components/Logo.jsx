import { motion } from 'framer-motion'

export function Logo({ onClick }) {
  return (
    <motion.button
      type="button"
      className="group flex items-center gap-3 text-left text-xl font-extrabold text-leaf-900 md:text-2xl"
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      aria-label="Lab KTNT UNPAD"
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm transition-transform duration-200 group-hover:rotate-[-3deg] md:h-[54px] md:w-[54px]">
        <img className="h-full w-full object-contain" src="/assets/images/logo.png" alt="Logo Lab KTNT UNPAD" />
      </span>
      <span className="tracking-[-0.01em]">Lab KTNT UNPAD</span>
    </motion.button>
  )
}