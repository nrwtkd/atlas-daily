import type { GoalCategory } from "./types";

export interface StepTemplate {
  title: string;
  minimum: string;
  steady: string;
  stretch: string;
}

export interface MilestoneTemplate {
  id: string;
  title: string;
  proof: string;
  steps: StepTemplate[];
}

export interface GoalTemplate {
  category: GoalCategory;
  label: string;
  icon: string;
  description: string;
  examples: string[];
  milestones: MilestoneTemplate[];
}

const commonReview: MilestoneTemplate = {
  id: "review",
  title: "Meninjau dan menyesuaikan",
  proof: "Aku tahu apa yang bekerja, apa yang menghambat, dan penyesuaian berikutnya.",
  steps: [
    {
      title: "Tinjau progres dan tentukan penyesuaian berikutnya",
      minimum: "Catat satu hal yang berjalan dan satu hambatan.",
      steady: "Tinjau progres, hambatan, dan pilih satu penyesuaian.",
      stretch: "Lakukan review lengkap dan susun fokus untuk minggu berikutnya."
    }
  ]
};

export const goalTemplates: GoalTemplate[] = [
  {
    category: "health",
    label: "Kesehatan",
    icon: "🌿",
    description: "Stamina, kebugaran, tidur, pola makan, atau perawatan diri.",
    examples: ["Lebih bugar dan tidak mudah lelah", "Olahraga rutin 3 kali seminggu", "Tidur lebih teratur"],
    milestones: [
      {
        id: "baseline",
        title: "Mengenali kondisi awal",
        proof: "Aku punya gambaran jujur tentang kondisi, kebiasaan, dan batas tubuhku sekarang.",
        steps: [
          { title: "Catat kondisi awal dan pola yang paling memengaruhi tubuh", minimum: "Tulis tiga keluhan atau kebutuhan tubuh.", steady: "Catat tidur, gerak, makan, dan energi selama satu hari.", stretch: "Buat catatan kondisi awal selama tiga hari dan simpulkan polanya." }
        ]
      },
      {
        id: "routine",
        title: "Membangun ritme yang realistis",
        proof: "Aku punya rutinitas minimum yang bisa dijalankan pada minggu sibuk.",
        steps: [
          { title: "Tentukan rutinitas kesehatan minimum", minimum: "Pilih satu aktivitas 10 menit.", steady: "Susun dua sampai tiga sesi realistis minggu ini.", stretch: "Susun jadwal, persiapan, dan rencana cadangan untuk minggu sibuk." },
          { title: "Jalankan satu sesi pertama", minimum: "Mulai selama 5–10 menit.", steady: "Selesaikan satu sesi sesuai rencana.", stretch: "Selesaikan sesi dan catat respons tubuh setelahnya." }
        ]
      },
      {
        id: "consistency",
        title: "Menguatkan konsistensi",
        proof: "Rutinitas berjalan cukup stabil tanpa harus sempurna setiap hari.",
        steps: [
          { title: "Kenali pemicu yang membantu rutinitas berjalan", minimum: "Pilih satu waktu atau pemicu tetap.", steady: "Tulis rencana jika–maka untuk rutinitasmu.", stretch: "Uji pemicu selama satu minggu dan catat hasilnya." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "learning",
    label: "Belajar",
    icon: "📚",
    description: "Ujian, kuliah, sertifikasi, atau keterampilan baru.",
    examples: ["Lulus ujian kompetensi", "Menguasai public speaking", "Menyelesaikan tesis"],
    milestones: [
      {
        id: "map",
        title: "Memetakan hasil dan materi",
        proof: "Aku tahu hasil yang dituju, materi yang harus dikuasai, dan bagian yang masih lemah.",
        steps: [
          { title: "Kumpulkan acuan belajar utama", minimum: "Cari satu sumber atau kisi-kisi utama.", steady: "Kumpulkan dan urutkan sumber utama.", stretch: "Buat peta materi lengkap beserta prioritasnya." },
          { title: "Ukur kemampuan awal", minimum: "Kerjakan 5 soal atau satu latihan singkat.", steady: "Kerjakan satu set latihan dan tandai kesalahan.", stretch: "Lakukan diagnostik lengkap dan kelompokkan area lemah." }
        ]
      },
      {
        id: "practice",
        title: "Belajar dan berlatih",
        proof: "Materi prioritas dipelajari dan kemampuan diuji secara berkala.",
        steps: [
          { title: "Pelajari satu bagian prioritas", minimum: "Belajar fokus 10 menit.", steady: "Pelajari satu subtopik dan buat ringkasan.", stretch: "Pelajari, rangkum, lalu uji dengan latihan." },
          { title: "Latihan dan koreksi kesalahan", minimum: "Kerjakan 5 soal.", steady: "Kerjakan 20 soal dan koreksi.", stretch: "Kerjakan simulasi, koreksi, dan catat pola kesalahan." }
        ]
      },
      {
        id: "simulation",
        title: "Simulasi dan pemantapan",
        proof: "Aku bisa mengerjakan simulasi mendekati kondisi nyata dan tahu strategi perbaikannya.",
        steps: [
          { title: "Lakukan simulasi kondisi nyata", minimum: "Latih satu bagian dengan batas waktu.", steady: "Lakukan satu simulasi terukur.", stretch: "Lakukan simulasi penuh dan evaluasi strategi." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "career",
    label: "Karier",
    icon: "🧭",
    description: "Kenaikan jenjang, perpindahan peran, portofolio, atau kesiapan profesional.",
    examples: ["Naik jenjang jabatan", "Mendapat peran baru", "Membangun portofolio profesional"],
    milestones: [
      {
        id: "target",
        title: "Menjelaskan arah karier",
        proof: "Aku tahu peran yang dituju dan alasan mengapa peran itu cocok untukku.",
        steps: [
          { title: "Rumusan peran atau hasil karier yang dituju", minimum: "Tulis satu kalimat arah karier.", steady: "Tulis peran, alasan, dan hasil yang diinginkan.", stretch: "Bandingkan beberapa pilihan dan tentukan prioritas." }
        ]
      },
      {
        id: "gap",
        title: "Memetakan kesenjangan",
        proof: "Aku tahu kompetensi, bukti kerja, dan persyaratan yang sudah ada maupun belum ada.",
        steps: [
          { title: "Petakan syarat dan kesenjangan utama", minimum: "Temukan satu syarat paling penting.", steady: "Buat daftar syarat dan status pemenuhannya.", stretch: "Buat gap map lengkap dengan prioritas dan tenggat." }
        ]
      },
      {
        id: "evidence",
        title: "Membangun bukti kesiapan",
        proof: "Aku memiliki hasil kerja, kompetensi, atau dokumen yang memperkuat kesiapan karier.",
        steps: [
          { title: "Kerjakan satu bukti kesiapan", minimum: "Mulai 10 menit pada satu dokumen atau karya.", steady: "Selesaikan satu bagian bukti kesiapan.", stretch: "Selesaikan, rapikan, dan minta umpan balik." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "finance",
    label: "Keuangan",
    icon: "💰",
    description: "Dana darurat, utang, tabungan, atau target pembelian.",
    examples: ["Membangun dana darurat", "Melunasi utang", "Menyiapkan biaya pendidikan"],
    milestones: [
      {
        id: "baseline",
        title: "Memahami posisi keuangan",
        proof: "Aku tahu pemasukan, kewajiban, pengeluaran utama, dan ruang yang tersedia.",
        steps: [
          { title: "Catat posisi keuangan saat ini", minimum: "Catat saldo dan satu kewajiban utama.", steady: "Catat pemasukan, kewajiban, dan pengeluaran tetap.", stretch: "Buat ringkasan arus kas dan temukan ruang perbaikan." }
        ]
      },
      {
        id: "target",
        title: "Menetapkan target dan sistem",
        proof: "Target nominal, tenggat, dan cara menyisihkan dana sudah jelas.",
        steps: [
          { title: "Tentukan target nominal dan setoran realistis", minimum: "Tentukan angka target.", steady: "Hitung setoran berkala yang realistis.", stretch: "Buat beberapa skenario dan pilih yang paling aman." },
          { title: "Siapkan mekanisme penyisihan", minimum: "Pilih rekening atau pos tujuan.", steady: "Atur transfer atau pengingat berkala.", stretch: "Otomatiskan dan dokumentasikan sistemnya." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "business",
    label: "Bisnis & proyek",
    icon: "🚀",
    description: "Produk digital, usaha, proyek kreatif, atau peluncuran layanan.",
    examples: ["Meluncurkan produk digital", "Menguji ide usaha", "Membuat layanan pelatihan baru"],
    milestones: [
      {
        id: "problem",
        title: "Menegaskan masalah dan pengguna",
        proof: "Masalah, sasaran pengguna, dan manfaat utama dapat dijelaskan dengan sederhana.",
        steps: [
          { title: "Tulis masalah pengguna dalam satu kalimat", minimum: "Tulis satu masalah yang sering muncul.", steady: "Tulis masalah, siapa yang mengalaminya, dan dampaknya.", stretch: "Validasi rumusan kepada calon pengguna." },
          { title: "Tentukan manfaat utama produk", minimum: "Tulis satu hasil yang dijanjikan.", steady: "Tulis perubahan sebelum dan sesudah memakai produk.", stretch: "Uji tiga versi manfaat dan pilih yang paling jelas." }
        ]
      },
      {
        id: "prototype",
        title: "Membuat versi minimum",
        proof: "Versi sederhana sudah dapat digunakan untuk membuktikan manfaat utama.",
        steps: [
          { title: "Tentukan fitur yang benar-benar wajib", minimum: "Pilih satu alur inti.", steady: "Pisahkan fitur wajib dan fitur nanti.", stretch: "Buat spesifikasi MVP lengkap namun ringkas." },
          { title: "Bangun satu alur utama sampai bisa dicoba", minimum: "Kerjakan 10 menit pada alur utama.", steady: "Selesaikan satu bagian yang bisa diuji.", stretch: "Selesaikan alur dan lakukan uji mandiri." }
        ]
      },
      {
        id: "test",
        title: "Menguji kepada pengguna",
        proof: "Calon pengguna sudah mencoba dan kebingungan utama telah dicatat.",
        steps: [
          { title: "Pilih calon penguji dan siapkan skenario uji", minimum: "Tentukan satu calon penguji.", steady: "Tentukan tiga penguji dan tugas yang dicoba.", stretch: "Siapkan panduan uji serta formulir umpan balik." },
          { title: "Lakukan satu uji pengguna", minimum: "Kirim tautan kepada satu orang.", steady: "Amati satu uji dan catat kebingungan.", stretch: "Lakukan beberapa uji dan kelompokkan temuan." }
        ]
      },
      {
        id: "launch",
        title: "Menyiapkan peluncuran",
        proof: "Produk, harga, halaman penjelasan, dan cara pembelian siap digunakan.",
        steps: [
          { title: "Siapkan penawaran dan cara membeli", minimum: "Tentukan harga awal.", steady: "Tulis penawaran, harga, dan cara membeli.", stretch: "Selesaikan landing page dan alur pembelian." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "family",
    label: "Keluarga & relasi",
    icon: "🏡",
    description: "Kedekatan, komunikasi, waktu berkualitas, atau rutinitas keluarga.",
    examples: ["Lebih hadir untuk keluarga", "Membangun rutinitas bersama anak", "Memperbaiki komunikasi pasangan"],
    milestones: [
      {
        id: "meaning",
        title: "Menentukan perubahan yang bermakna",
        proof: "Aku tahu bentuk kedekatan atau komunikasi yang ingin dibangun.",
        steps: [
          { title: "Jelaskan momen atau perilaku yang ingin lebih sering hadir", minimum: "Tulis satu momen yang ingin dijaga.", steady: "Tulis perubahan yang diinginkan dan alasannya.", stretch: "Diskusikan harapan dengan orang yang terlibat." }
        ]
      },
      {
        id: "ritual",
        title: "Membangun ritual kecil",
        proof: "Ada satu kebiasaan hubungan yang sederhana dan bisa diulang.",
        steps: [
          { title: "Pilih satu ritual hubungan yang realistis", minimum: "Pilih ritual 5–10 menit.", steady: "Tentukan waktu, bentuk, dan frekuensinya.", stretch: "Siapkan ritual utama dan versi cadangan saat sibuk." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "spiritual",
    label: "Spiritualitas",
    icon: "✨",
    description: "Ibadah, refleksi, rasa syukur, atau pertumbuhan iman.",
    examples: ["Lebih khusyuk dalam ibadah", "Menjaga rutinitas doa", "Mendalami pemahaman agama"],
    milestones: [
      {
        id: "intention",
        title: "Meneguhkan niat dan makna",
        proof: "Aku tahu mengapa tujuan spiritual ini penting dan bagaimana aku ingin menjalaninya.",
        steps: [
          { title: "Tulis niat dan perubahan batin yang diharapkan", minimum: "Tulis satu kalimat niat.", steady: "Tulis niat, makna, dan bentuk perilakunya.", stretch: "Buat refleksi pribadi dan doa yang ingin dijaga." }
        ]
      },
      {
        id: "rhythm",
        title: "Membangun ritme minimum",
        proof: "Ada praktik sederhana yang tetap bisa dilakukan pada hari sibuk.",
        steps: [
          { title: "Tentukan praktik minimum dan pemicunya", minimum: "Pilih praktik 5 menit.", steady: "Tentukan waktu dan bentuk praktik.", stretch: "Susun ritme harian serta mingguan yang saling mendukung." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "personal",
    label: "Pengembangan diri",
    icon: "🌱",
    description: "Kepercayaan diri, keterampilan, kreativitas, atau kebiasaan personal.",
    examples: ["Lebih percaya diri berbicara", "Menulis secara rutin", "Mengurangi kebiasaan menunda"],
    milestones: [
      {
        id: "define",
        title: "Menentukan perilaku yang ingin berubah",
        proof: "Tujuan diterjemahkan menjadi perilaku yang dapat diamati.",
        steps: [
          { title: "Ubah keinginan menjadi perilaku konkret", minimum: "Tulis satu perilaku yang ingin dilakukan.", steady: "Tulis situasi, perilaku, dan hasil yang diharapkan.", stretch: "Tentukan indikator dan contoh keberhasilan nyata." }
        ]
      },
      {
        id: "practice",
        title: "Melatih dalam ukuran kecil",
        proof: "Latihan dilakukan dalam situasi nyata dan dapat dievaluasi.",
        steps: [
          { title: "Lakukan satu latihan kecil", minimum: "Latihan selama 5–10 menit.", steady: "Lakukan satu latihan terarah dan catat hasilnya.", stretch: "Latihan dalam situasi nyata dan minta umpan balik." }
        ]
      },
      commonReview
    ]
  },
  {
    category: "custom",
    label: "Tujuan lainnya",
    icon: "🗺️",
    description: "Tujuan yang belum cocok dengan kategori di atas.",
    examples: ["Menyelesaikan proyek pribadi", "Mengatur ulang kehidupan sehari-hari", "Mewujudkan rencana khusus"],
    milestones: [
      {
        id: "clarify",
        title: "Menjelaskan hasil akhir",
        proof: "Hasil akhir, kondisi saat ini, dan bukti keberhasilan sudah jelas.",
        steps: [
          { title: "Tulis hasil akhir dan bukti keberhasilannya", minimum: "Tulis hasil akhir dalam satu kalimat.", steady: "Tulis hasil akhir, kondisi awal, dan bukti selesai.", stretch: "Uji rumusan kepada orang lain dan perjelas bagian yang ambigu." }
        ]
      },
      {
        id: "path",
        title: "Menyusun jalan awal",
        proof: "Tahap pertama dan langkah terkecil sudah dapat dikerjakan.",
        steps: [
          { title: "Temukan prasyarat dan langkah pertama", minimum: "Tulis satu hal yang harus tersedia lebih dulu.", steady: "Urutkan tiga prasyarat utama.", stretch: "Buat urutan tahap lengkap dan pilih langkah pertama." }
        ]
      },
      commonReview
    ]
  }
];

export function getGoalTemplate(category: GoalCategory): GoalTemplate {
  return goalTemplates.find((template) => template.category === category) ?? goalTemplates[goalTemplates.length - 1];
}
