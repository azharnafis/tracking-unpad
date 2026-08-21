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
    <header className="sticky top-0 z-50 border-b border-leaf-900/10 bg-leaf-50/95 backdrop-blur supports-[backdrop-filter]:bg-leaf-50/85">
      <div className="mx-auto flex min-h-[65px] max-w-[1280px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-10">
        <Logo onClick={() => onNavigate('home')} />
        <nav className="flex items-center gap-6 text-sm font-bold text-[#3f443c] sm:gap-8" aria-label="Navigasi utama">
          {navItems.map((item) => {
            const isActive = isActiveNav(currentPage, item.page)
            return (
              <button
                type="button"
                className="relative py-5 transition-colors duration-200 hover:text-leaf-900"
                onClick={() => onNavigate(item.page)}
                key={item.page}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-0 bottom-3 h-[2px] bg-leaf-900"
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