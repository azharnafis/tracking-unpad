import {
  Atom,
  BadgeCheck,
  Compass,
  CreditCard,
  Download,
  Droplets,
  FileCheck2,
  FileSearch,
  FlaskConical,
  GraduationCap,
  Grid2X2,
  Inbox,
  Layers,
  Leaf,
  Microscope,
  PenLine,
  ReceiptText,
  Sprout,
  TrendingUp,
} from 'lucide-react'

export const navItems = [
  { label: 'Beranda', page: 'home' },
  { label: 'Lacak Sampel', page: 'tracking' },
]

export const labSlides = [
  {
    image: '/assets/images/slide1.jpeg',
    caption: 'Kepala Laboratorium KTNT UNPAD beserta Tim Peneliti',
  },
  {
    image: '/assets/images/slide2.jpeg',
    caption: 'Fasilitas Instrumentasi Pengujian dan Analisis',
  },
  {
    image: '/assets/images/slide3.jpeg',
    caption: 'Ruang Preparasi dan Pengujian Sampel',
  },
]

export const serviceCategories = [
  {
    title: 'Pengujian Mutu',
    description: 'Pengujian pupuk, pembenah tanah, pestisida, air, tanah, dan tanaman.',
    image: '/assets/images/pengujianmutu.jpeg',
    icon: FlaskConical,
    iconBg: '#C4EAB6',
    iconColor: '#496B41',
  },
  {
    title: 'Pengujian Efektivitas',
    description: 'Pengujian efektivitas produk pertanian di lahan sendiri dipantau tim ahli.',
    image: '/assets/images/pengujianefektivitas.jpeg',
    icon: TrendingUp,
    iconBg: 'rgba(200, 167, 75, 0.2)',
    iconColor: '#4F3D00',
  },
  {
    title: 'Jasa Survei & Sampling',
    description: 'Petugas survey dan pengambil contoh tersertifikasi.',
    image: '/assets/images/jasasurveisampling.jpeg',
    icon: Compass,
    iconBg: '#D4EABD',
    iconColor: '#101F05',
  },
  {
    title: 'Konsultan & Pelatihan',
    description: 'Program pelatihan dan konsultasi berkelanjutan.',
    image: '/assets/images/konsultanpelatihan.jpeg',
    icon: GraduationCap,
    iconBg: '#E7E2DA',
    iconColor: '#44483F',
  },
]

export const services = [
  {
    number: '1',
    title: 'Pupuk Organik',
    description: 'Standardisasi kandungan bahan organik dan hara alami.',
  },
  {
    number: '2',
    title: 'Pupuk Anorganik',
    description: 'Analisis kadar unsur hara makro dan mikro kimia.',
  },
  {
    number: '3',
    title: 'Pupuk Hayati',
    description: 'Uji mutu dan efektivitas formula mikroorganisme pupuk.',
  },
  {
    number: '4',
    title: 'Pembenah Tanah',
    description: 'Uji efektivitas formula organik perbaikan struktur tanah.',
  },
  {
    number: '5',
    title: 'Tanah',
    description: 'Analisis konsentrasi asam humat untuk kesuburan.',
  },
  {
    number: '6',
    title: 'Air',
    description: 'Pengujian mutu bahan kaptan, dolomit, dan sejenisnya.',
  },
  {
    number: '7',
    title: 'Tanaman',
    description: 'Evaluasi karakteristik kimia dan fisik tanah pertanian.',
  },
  {
    number: '8',
    title: 'Pelatihan',
    description: 'Uji kelayakan dan kualitas air irigasi budidaya.',
  },
]

export const adminWhatsapp = {
  phoneDisplay: '085861927889',
  phoneRaw: '6285861927889',
  whatsappUrl: 'https://wa.me/6285861927889',
}

export const contactInfo = {
  addressLines: [
    'Gedung 9 (ex Pedca), Fakultas Pertanian, UNPAD',
    'Jl. Raya Bandung Sumedang KM. 21, Jatinangor',
  ],
  emails: [
    'kalab.ktnt.faperta@unpad.ac.id',
    'ktnt.pafertaunpad@gmail.com',
  ],
  phoneDisplay: '+62 821 2860 8109',
  phoneRaw: '6282128608109',
  whatsappUrl: 'https://wa.me/6282128608109',
  instagramUsername: '@labktnt.unpad',
  instagramUrl: 'https://www.instagram.com/labktnt.unpad?igsi=azN2Yjc5dGxyeTN5',
}

export const processSteps = [
  {
    number: '1',
    title: 'Sampel Diterima',
    description: 'Registrasi fisik',
    icon: Inbox,
    status: 'SAMPEL_DITERIMA',
  },
  {
    number: '2',
    title: 'Pembayaran',
    description: 'Verifikasi biaya',
    icon: CreditCard,
    status: 'PEMBAYARAN',
  },
  {
    number: '3',
    title: 'Analisis',
    description: 'Pengujian lab',
    icon: FlaskConical,
    status: 'ANALISIS',
  },
  {
    number: '4',
    title: 'Review Draft',
    description: 'Validasi draft hasil',
    icon: FileSearch,
    status: 'REVIEW_DRAFT',
  },
  {
    number: '5',
    title: 'Pengesahan',
    description: 'Tanda tangan ka. lab',
    icon: BadgeCheck,
    status: 'PENGESAHAN',
  },
  {
    number: '6',
    title: 'Unduh Sertifikat',
    description: 'Hasil digital',
    icon: Download,
    status: 'DOWNLOAD_SERTIFIKAT',
  },
]

export const sampleFlowCards = [
  {
    title: 'Invoice Pembayaran',
    description: 'Admin mengunggah invoice PDF dan customer dapat mengirim bukti pembayaran dari halaman status.',
    icon: ReceiptText,
  },
  {
    title: 'Review Draft',
    description: 'Customer memeriksa draft hasil. Jika ada revisi, komunikasi diarahkan ke admin sebelum pengesahan.',
    icon: PenLine,
  },
  {
    title: 'Sertifikat Final',
    description: 'Setelah kuesioner diisi, sistem membuka akses download sertifikat hasil pengujian.',
    icon: FileCheck2,
  },
]

export const googleMapsUrl = 'https://maps.app.goo.gl/C6smYW9TWh9B5zK46'
export const googleMapsEmbedUrl = 'https://maps.google.com/maps?q=Laboratorium+Kimia+Tanah+dan+Nutrisi+Tanaman+Fakultas+Pertanian+Universitas+Padjadjaran+Jatinangor&t=&z=16&ie=UTF8&iwloc=&output=embed'