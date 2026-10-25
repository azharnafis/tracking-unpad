import { motion } from 'framer-motion'
import { navItems } from '../data/siteData'
import { Logo } from './Logo'

function isActiveNav(currentPage, itemPage) {
  if (itemPage === 'tracking') {
    return ['tracking', 'status'].includes(currentPage)
  }

  return currentPage === itemPage
}

export function Header({ currentPage, onNavigate }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#C5C8BC] bg-[#FBFCF7]/95 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12 xl:px-16">
        <Logo onClick={() => onNavigate('home')} />
        <nav className="flex items-center gap-6 text-base font-normal text-[#44483F] sm:gap-8" aria-label="Navigasi utama">
          {navItems.map((item) => {
            const isActive = isActiveNav(currentPage, item.page)
            return (
              <button
                type="button"
                className={`relative py-4 text-base font-medium transition-colors duration-200 hover:text-[#1D1C17] ${
                  isActive ? 'text-[#1D1C17] font-semibold' : 'text-[#44483F]'
                }`}
                onClick={() => onNavigate(item.page)}
                key={item.page}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#44483F]"
                    transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </header>
  )
}