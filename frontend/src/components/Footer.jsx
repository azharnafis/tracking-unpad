const footerGroups = [
  {
    title: 'Navigasi',
    links: [
      { label: 'Beranda', href: '#beranda' },
      { label: 'Layanan', href: '#layanan' },
      { label: 'Kontak', href: '#kontak' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Kebijakan Privasi', href: '#' },
      { label: 'Persyaratan Layanan', href: '#' },
    ],
  },
]

export function Footer({ compact = false }) {
  if (compact) {
    return (
      <footer className="border-t border-leaf-900/10 bg-leaf-50 px-5 py-8 text-sm text-[#3f443c]">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Lab KTNT UNPAD. Departemen Ilmu Tanah, Universitas Padjadjaran.</p>
          <div className="flex flex-wrap gap-6 text-xs font-bold tracking-[0.08em] text-[#596150]">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat &amp; Ketentuan</a>
            <a href="#kontak">Kontak Kami</a>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-leaf-900 text-white/70">
      <div className="mx-auto grid max-w-[1180px] gap-12 px-6 py-16 md:grid-cols-[1.3fr_1fr_1fr] md:px-10 md:py-20">
        <div>
          <h2 className="mb-6 text-2xl font-extrabold text-white">Lab KTNT UNPAD</h2>
          <p className="max-w-[310px] font-semibold leading-7">Laboratorium Kimia Tanah &amp; Nutrisi Tanaman. Berdedikasi pada keunggulan ilmiah dan akurasi analitis sejak pendiriannya.</p>
        </div>
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#d1d844]">{group.title}</h3>
            {group.links.map((link) => (
              <a className="my-2 block font-bold transition-colors duration-200 hover:text-white" href={link.href} key={link.label}>{link.label}</a>
            ))}
          </div>
        ))}
      </div>
      <p className="border-t border-white/10 px-6 py-6 text-center text-xs tracking-[0.18em] text-white/40">© 2026 Lab KTNT UNPAD. Departemen Ilmu Tanah, Universitas Padjadjaran.</p>
    </footer>
  )
}