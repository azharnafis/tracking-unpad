export function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="border-t border-[#4B5A3D]/40 bg-[#394C25] px-5 py-6 text-sm text-white/80">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 md:flex-row md:items-center md:justify-between font-mono text-xs text-white/60">
          <p>© 2026 LAB KTNT UNPAD. Faperta, Universitas Padjadjaran.</p>
          <div className="flex flex-wrap gap-6">
            <a href="#" className="hover:text-white transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-white transition-colors">Persyaratan Layanan</a>
            <a href="#kontak" className="hover:text-white transition-colors">Kontak</a>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t border-[#4B5A3D] bg-[#394C25] text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr] md:gap-16 lg:px-12 xl:px-16 lg:py-16">
        <div>
          <h3 className="mb-4 text-2xl font-bold text-white tracking-tight">Lab KTNT UNPAD</h3>
          <p className="max-w-[340px] text-base font-normal leading-relaxed text-white/80">
            Laboratorium Kimia Tanah &amp; Nutrisi Tanaman. Berdedikasi pada keunggulan ilmiah dan akurasi analisis sejak pendiriannya.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.06em] text-[#FBEF6F]">NAVIGASI</h4>
          <ul className="space-y-3">
            <li>
              <a href="#beranda" className="text-base font-normal text-white/80 transition-colors duration-200 hover:text-white">
                Beranda
              </a>
            </li>
            <li>
              <a href="#layanan" className="text-base font-normal text-white/80 transition-colors duration-200 hover:text-white">
                Layanan
              </a>
            </li>
            <li>
              <a href="#kontak" className="text-base font-normal text-white/80 transition-colors duration-200 hover:text-white">
                Kontak
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.06em] text-[#FBEF6F]">LEGAL</h4>
          <ul className="space-y-3">
            <li>
              <a href="#" className="text-base font-normal text-white/80 transition-colors duration-200 hover:text-white">
                Kebijakan Privasi
              </a>
            </li>
            <li>
              <a href="#" className="text-base font-normal text-white/80 transition-colors duration-200 hover:text-white">
                Persyaratan Layanan
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center">
        <p className="font-mono text-xs font-normal tracking-[0.05em] text-white/60">
          © 2026 LAB KTNT UNPAD. Faperta, Universitas Padjadjaran.
        </p>
      </div>
    </footer>
  )
}