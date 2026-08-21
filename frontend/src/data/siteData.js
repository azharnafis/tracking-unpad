import {
  Atom,
  BadgeCheck,
  CreditCard,
  Download,
  Droplets,
  FileCheck2,
  FileSearch,
  FlaskConical,
  Grid2X2,
  Inbox,
  Layers,
  Leaf,
  Microscope,
  PenLine,
  ReceiptText,
  Sprout,
} from 'lucide-react'

export const navItems = [
  { label: 'Beranda', page: 'home' },
  { label: 'Lacak Sampel', page: 'tracking' },
]

export const services = [
  {
    title: 'Pupuk Hayati (Cair/Padat)',
    description: 'Uji mutu dan efektivitas formula mikroorganisme pupuk.',
    icon: FlaskConical,
  },
  {
    title: 'Pupuk Anorganik (Cair/Padat)',
    description: 'Analisis kadar unsur hara makro dan mikro kimia.',
    icon: Atom,
  },
  {
    title: 'Pupuk Organik (Cair/Padat)',
    description: 'Standardisasi kandungan bahan organik dan hara alami.',
    icon: Microscope,
  },
  {
    title: 'Pembenah Tanah Organik',
    description: 'Uji efektivitas formula organik perbaikan struktur tanah.',
    icon: Sprout,
  },
  {
    title: 'Pembenah Tanah Senyawa Humat',
    description: 'Analisis konsentrasi asam humat untuk kesuburan.',
    icon: Leaf,
  },
  {
    title: 'Pembenah Tanah Anorganik',
    description: 'Pengujian mutu bahan kaptan, dolomit, dan sejenisnya.',
    icon: Grid2X2,
  },
  {
    title: 'Analisis Sampel Tanah',
    description: 'Evaluasi karakteristik kimia dan fisik tanah pertanian.',
    icon: Layers,
  },
  {
    title: 'Analisis Sampel Air',
    description: 'Uji kelayakan dan kualitas air irigasi budidaya.',
    icon: Droplets,
  },
]

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
    status: 'PROSES_ANALISIS',
  },
  {
    number: '4',
    title: 'Input Data',
    description: 'Perekaman hasil',
    icon: Grid2X2,
    status: 'INPUT_DATA_HASIL',
  },
  {
    number: '5',
    title: 'Review Draft',
    description: 'Validasi internal',
    icon: FileSearch,
    status: 'REVIEW_DRAFT',
  },
  {
    number: '6',
    title: 'Pengesahan',
    description: 'Tanda tangan ka. lab',
    icon: BadgeCheck,
    status: 'PENGESAHAN',
  },
  {
    number: '7',
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

export const googleMapsUrl = 'https://share.google/0cH9Bv1biYJFx2ZKz'
export const googleMapsEmbedUrl = ''