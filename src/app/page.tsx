import Link from "next/link";
import { FlipBotAvatar } from "@/app/_components/flipbot";
import { Icon } from "@/app/_components/icon";
import { HeroPredict } from "@/app/_components/landing/hero-predict";
import { HeroVideo } from "@/app/_components/landing/hero-video";

// Landing page in the Stitch "Warm Learning Lab" style. Copy supplied by the
// participant (2026-10-15); claims stay within what the product does.

const STEPS = [
  {
    n: "01",
    icon: "record_voice_over",
    tone: "bg-primary-fixed text-on-primary-fixed",
    title: "Jelaskan",
    lead: "Coba ajari FlipBot!",
    body: "Bayangkan kamu sedang menjelaskan sesuatu kepada teman yang belum pernah mempelajarinya. Gunakan kata-katamu sendiri. Tidak harus terdengar seperti buku pelajaran.",
  },
  {
    n: "02",
    icon: "visibility",
    tone: "bg-secondary-fixed text-on-secondary-fixed",
    title: "Prediksi",
    lead: "Coba tebak sebelum melihat jawabannya.",
    body: "Baca kode dan bayangkan apa yang akan terjadi ketika kode itu dijalankan. Tidak masalah kalau belum yakin. Justru di sinilah rasa penasaran dimulai.",
  },
  {
    n: "03",
    icon: "task_alt",
    tone: "bg-tertiary-fixed text-on-tertiary-fixed",
    title: "Cocokkan",
    lead: "Lihat apakah dugaanmu benar.",
    body: "Bandingkan tebakanmu dengan hasil yang sudah diperiksa. Cari tahu bagian mana yang sesuai dengan pemahamanmu dan bagian mana yang mengejutkan.",
  },
  {
    n: "04",
    icon: "bug_report",
    tone: "bg-error-container text-on-error-container",
    title: "Perbaiki",
    lead: "Belum tepat? Kita coba lagi.",
    body: "FlipBot akan memberikan petunjuk agar kamu bisa menemukan jawabannya sendiri. Sedikit demi sedikit, kamu belajar bukan hanya memperbaiki kesalahan, tetapi juga memahami penyebabnya.",
  },
] as const;

const FEATURES = [
  {
    href: "/belajar",
    icon: "smart_toy",
    tone: "bg-primary-container text-on-primary",
    kicker: "Ajari Robot",
    title: "Kamu jadi guru, FlipBot jadi murid.",
    body: [
      "FlipBot akan mendengarkan penjelasanmu, mengajukan pertanyaan, dan membantumu menemukan bagian yang sudah kamu pahami maupun yang masih perlu dipelajari.",
    ],
    cta: "Ajari FlipBot",
  },
  {
    href: "/ide",
    icon: "terminal",
    tone: "bg-inverse-surface text-inverse-on-surface",
    kicker: "Mini IDE",
    title: "Tulis kode. Cari tahu cara kerjanya.",
    body: [
      "Coba tulis kode, jalankan program yang didukung, dan lihat apa yang terjadi. Ketika ada yang tidak sesuai harapan, pelajari kemungkinan penyebabnya dan cari cara memperbaikinya.",
    ],
    cta: "Buka Mini IDE",
  },
  {
    href: "/misi",
    icon: "bug_report",
    tone: "bg-tertiary-container text-on-tertiary",
    kicker: "Misi Debug",
    title: "Ada yang salah dengan kode robot!",
    body: [
      "FlipBot menemukan program yang hasilnya tidak sesuai harapan. Bisakah kamu menemukan baris yang bermasalah dan menjelaskan apa yang perlu diperbaiki?",
      "Jangan buru-buru mencari jawaban. Coba amati petunjuknya terlebih dahulu.",
    ],
    cta: "Mulai Misi Debug",
  },
  {
    href: "/misi",
    icon: "quiz",
    tone: "bg-secondary-container text-on-secondary",
    kicker: "Prediksi Dulu",
    title: "Sebelum komputer menjawab, bagaimana denganmu?",
    body: [
      "Tantang dirimu untuk menebak hasil kode sebelum melihat output-nya. Setelah itu, bandingkan hasilnya dan cari tahu mengapa program berjalan seperti itu.",
    ],
    cta: "Coba Tantangan",
  },
] as const;

const PHILOSOPHY = [
  {
    icon: "workspace_premium",
    title: "Bukan sekadar angka",
    body: "Kamu akan melihat alasan di balik hasil penilaian, bukan hanya skor akhir.",
  },
  {
    icon: "edit_note",
    title: "Bukan sekadar menyalin solusi",
    body: "Kamu mendapat kesempatan untuk berpikir, mencoba, dan memperbaiki jawabanmu sendiri.",
  },
  {
    icon: "trending_up",
    title: "Bukan tentang menjadi sempurna",
    body: "Yang penting adalah memahami lebih banyak daripada sebelumnya dan berani mencoba lagi.",
  },
] as const;

const TRUST = [
  {
    icon: "psychology",
    title: "AI yang membimbing",
    body: "FlipBot memberikan pertanyaan dan petunjuk agar kamu tetap terlibat dalam proses berpikir.",
  },
  {
    icon: "verified_user",
    title: "Hasil yang bisa dipahami",
    body: "Kamu dapat melihat dasar penilaian dan alasan di balik saran yang diberikan.",
  },
  {
    icon: "shield",
    title: "Privasi yang diperhatikan",
    body: "Gunakan identitas yang sesuai dengan pengaturan platform. Hindari membagikan informasi pribadi di ruang belajar maupun komunitas.",
  },
] as const;

function Eyebrow({
  children,
  tone = "primary",
}: {
  children: React.ReactNode;
  tone?: "primary" | "secondary" | "light";
}) {
  const colors = {
    primary: "bg-surface-container text-primary",
    secondary: "bg-secondary-fixed text-on-secondary-fixed",
    light: "bg-white/15 text-on-primary",
  }[tone];
  return <span className={`chip w-fit uppercase ${colors}`}>{children}</span>;
}

export default function Home() {
  return (
    <>
      {/* 01. HERO */}
      <section className="relative w-full overflow-hidden px-4 py-12 sm:px-6 lg:px-12 lg:py-20">
        {/* Decorative background video, faded so the text stays readable. */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.22]">
          <HeroVideo />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-surface via-surface/85 to-surface/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-secondary-fixed/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 rounded-full bg-primary-fixed/30 blur-3xl" />
        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-5 lg:col-span-6">
            <p className="text-label-ui uppercase text-primary">
              Flip the Way You Learn
            </p>
            <h1 className="text-balance text-display-hero-mobile text-on-surface sm:text-display-hero">
              Bagaimana kalau kali ini,{" "}
              <span className="text-primary-container">
                kamu yang mengajari AI?
              </span>
            </h1>
            <p className="max-w-xl text-body-lg text-on-surface">
              Kenalan dengan FlipBot, robot kecil yang punya banyak pertanyaan
              dan rasa penasaran yang besar.
            </p>
            <p className="max-w-xl text-body-md text-on-surface-variant">
              Biasanya, kita bertanya kepada AI lalu menerima jawabannya. Di
              CogniFlip, giliran kamu yang menjelaskan, menebak hasil kode, dan
              membantu FlipBot memahami cara kerja sesuatu.
            </p>
            <p className="max-w-xl text-body-md text-on-surface-variant">
              Sebab, memahami coding bukan cuma soal mendapatkan jawaban yang
              benar. Kamu juga perlu tahu <em>kenapa</em> jawabannya benar.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/belajar" className="btn-primary text-headline-sm">
                <Icon name="rocket_launch" size={24} />
                Yuk, Mulai Belajar
              </Link>
              <Link
                href="/ide"
                className="btn-secondary !min-h-[52px] bg-surface-container-lowest text-headline-sm shadow-md"
              >
                <Icon name="terminal" size={22} />
                Coba Mini IDE
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <HeroPredict />
          </div>
        </div>
      </section>

      {/* 02. THE BIG IDEA */}
      <section className="w-full bg-surface-container-low px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-7">
            <Eyebrow>Belajar dengan cara yang berbeda</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Bukan cuma mencari jawaban. Belajar memahami alasannya.
            </h2>
            <p className="text-body-lg text-on-surface">
              Pernah mendapatkan jawaban dari AI, merasa sudah mengerti, lalu
              bingung ketika harus mengerjakannya sendiri?
            </p>
            <p className="text-body-md text-on-surface-variant">
              Itu wajar. Membaca jawaban dan benar-benar memahami sesuatu
              ternyata tidak selalu sama.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Di CogniFlip, kamu tidak harus langsung menjadi ahli coding. Kamu
              cukup mulai dengan apa yang kamu tahu, mencoba menjelaskannya, dan
              berani mencari tahu ketika ada bagian yang belum kamu pahami.
            </p>
            <p className="text-body-md text-on-surface-variant">
              FlipBot akan menemanimu bertanya, mencoba, dan menemukan
              jawabannya bersama-sama.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="card flex flex-col items-center gap-5 p-8 text-center">
              <FlipBotAvatar size="lg" tone="secondary" status="online" />
              <p className="text-headline-md text-primary">
                “Satu pertanyaan kecil bisa menjadi awal dari pemahaman yang
                lebih besar.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03. HOW IT WORKS */}
      <section className="w-full px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-12">
          <div className="flex max-w-3xl flex-col gap-3">
            <Eyebrow tone="secondary">Petualangan belajarmu</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Empat langkah kecil untuk memahami hal besar.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Setiap misi punya perjalanan yang sederhana. Tidak perlu
              buru-buru. Kita pahami satu hal sebelum melangkah ke hal
              berikutnya.
            </p>
          </div>
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <li key={step.n} className="card flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.tone}`}
                  >
                    <Icon name={step.icon} size={28} />
                  </span>
                  <span
                    aria-hidden="true"
                    className="select-none text-display-hero-mobile text-surface-container-highest"
                  >
                    {step.n}
                  </span>
                </div>
                <h3 className="text-headline-md text-on-surface">
                  <span className="sr-only">{step.n}. </span>
                  {step.title}
                </h3>
                <p className="text-body-md font-semibold text-primary">
                  {step.lead}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
          <Link href="/belajar" className="btn-primary w-fit">
            Coba Misi Pertamaku
            <Icon name="arrow_forward" />
          </Link>
        </div>
      </section>

      {/* 04. FEATURE SHOWCASE */}
      <section className="w-full bg-surface-container-low px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Eyebrow>Jelajahi CogniFlip</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Satu tempat, banyak cara untuk belajar coding.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Tidak semua orang memahami sesuatu dengan cara yang sama. Ada
              kalanya kita perlu menjelaskan, melihat contoh, mencoba kode, atau
              menemukan kesalahan sendiri.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Pilih cara yang ingin kamu coba, lalu mulai dari sana.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.kicker} className="card flex gap-5 p-6">
                <span
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${f.tone}`}
                >
                  <Icon name={f.icon} size={30} filled />
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="text-label-ui uppercase text-primary">
                    {f.kicker}
                  </h3>
                  <p className="text-headline-sm text-on-surface">{f.title}</p>
                  {f.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-body-md text-on-surface-variant"
                    >
                      {paragraph}
                    </p>
                  ))}
                  <Link
                    href={f.href}
                    className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg py-1 text-label-ui text-primary hover:underline"
                  >
                    {f.cta}
                    <Icon name="arrow_forward" size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 05. MINI IDE DEEP DIVE */}
      <section className="w-full px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <Eyebrow tone="secondary">
              Dari rasa penasaran menjadi karya
            </Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Jangan cuma melihat kode. Pahami apa yang terjadi di baliknya.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Kamu menemukan potongan kode, tetapi belum tahu apa fungsinya.
              Atau programmu berjalan, tetapi hasilnya berbeda dari yang kamu
              harapkan.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Mulailah dengan mencoba. CogniFlip membantumu melihat kode dari
              sudut pandang yang berbeda: apa yang sudah benar, apa yang mungkin
              bermasalah, dan apa yang bisa dibuat lebih baik.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Pelajari kemungkinan kesalahan, pahami saran perbaikannya, dan
              coba lagi dengan pemahaman yang lebih kuat.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Karena tujuan akhirnya bukan sekadar membuat program berjalan.
              Kamu juga belajar menulis kode yang lebih mudah dibaca, dipahami,
              dan dikembangkan.
            </p>
            <Link href="/ide" className="btn-primary w-fit">
              <Icon name="terminal" />
              Eksplorasi Mini IDE
            </Link>
            <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
              <Icon name="info" size={18} className="text-primary" />
              Hasil analisis AI merupakan saran yang perlu diperiksa. Status
              yang dikonfirmasi oleh alat pemeriksaan akan ditampilkan secara
              terpisah.
            </p>
          </div>
          <div className="lg:col-span-6">
            <figure
              aria-label="Contoh tampilan Mini IDE"
              className="overflow-hidden rounded-3xl bg-inverse-surface shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-danger" />
                  <span className="h-3 w-3 rounded-full bg-secondary-container" />
                  <span className="h-3 w-3 rounded-full bg-tertiary-fixed-dim" />
                  <span className="ml-2 font-mono text-label-code-sm text-surface-container-highest">
                    hitung.py
                  </span>
                </span>
                <span className="font-mono text-label-code-sm text-surface-container-high">
                  Contoh tampilan
                </span>
              </div>
              <pre className="overflow-x-auto p-5 font-mono text-label-code-lg leading-7 text-inverse-on-surface">
                {"for angka in range(5):\n    print(angka)"}
              </pre>
              <div className="border-t border-white/10 bg-console px-5 py-3 font-mono text-label-code-sm leading-6">
                <p className="text-surface-container-high">
                  $ python hitung.py
                </p>
                <p className="whitespace-pre text-console-text">
                  {"0\n1\n2\n3\n4"}
                </p>
                <p className="text-surface-container-high">
                  Program selesai. Hasilnya mulai dari 0, bukan 1. Kenapa, ya?
                </p>
              </div>
              <figcaption className="flex items-start gap-3 bg-surface-container-lowest p-5">
                <span className="chip shrink-0 bg-surface-container text-on-surface-variant">
                  Saran AI
                </span>
                <span className="text-body-sm text-on-surface">
                  <strong>Baris 1:</strong>{" "}
                  <code className="font-mono">range(5)</code> dimulai dari 0.
                  Coba <code className="font-mono">range(1, 6)</code> kalau
                  ingin mencetak 1 sampai 5.
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* 06. LEARNING PHILOSOPHY */}
      <section className="w-full bg-surface-container-low px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Eyebrow>Di CogniFlip, kesalahan punya gunanya</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Salah menjawab bukan berarti kamu tidak bisa.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Kadang-kadang, satu jawaban yang belum tepat justru menunjukkan
              bagian mana yang perlu kita pahami lebih dalam.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Itulah mengapa FlipBot tidak buru-buru memberikan semua jawaban.
              Ia akan membantumu melihat apa yang sudah kamu pahami, mengajukan
              pertanyaan ketika ada yang belum jelas, dan memberikan petunjuk
              untuk percobaan berikutnya.
            </p>
            <p className="text-body-md font-semibold text-on-surface">
              Setiap percobaan adalah kesempatan baru untuk memahami sesuatu
              dengan lebih baik.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {PHILOSOPHY.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>
        </div>
      </section>

      {/* 07. TRUST & SAFETY */}
      <section className="w-full px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          <div className="flex max-w-3xl flex-col gap-3">
            <Eyebrow tone="secondary">Belajar dengan tenang</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Ruang belajar yang mengutamakan rasa ingin tahu dan keamanan.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Belajar hal baru seharusnya membuatmu berani mencoba, bukan takut
              melakukan kesalahan.
            </p>
            <p className="text-body-md text-on-surface-variant">
              CogniFlip dirancang dengan prinsip bahwa AI adalah pendamping
              belajar, bukan pengganti pemikiranmu. Penilaian disertai alasan,
              saran kode diberi konteks, dan hasil yang belum bisa diverifikasi
              tidak akan disamarkan sebagai kepastian.
            </p>
            <p className="text-body-md text-on-surface-variant">
              Kami juga mengutamakan privasi. Kamu tidak perlu membagikan
              informasi pribadi yang tidak dibutuhkan untuk belajar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRUST.map((item) => (
              <InfoCard key={item.title} {...item} />
            ))}
          </div>
          <Link href="/privasi" className="btn-secondary w-fit">
            <Icon name="shield" />
            Baca Panduan Keamanan
          </Link>
        </div>
      </section>

      {/* 08. FOR PARENTS & TEACHERS */}
      <section className="w-full bg-surface-container-low px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Eyebrow>Untuk orang tua dan pendidik</Eyebrow>
            <h2 className="text-headline-lg-mobile text-on-surface sm:text-headline-lg">
              Bantu anak belajar memahami, bukan sekadar menyelesaikan.
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Teknologi dapat memberikan jawaban dengan cepat. Tantangannya
              adalah memastikan anak tetap punya kesempatan untuk berpikir,
              mencoba, dan membangun pemahamannya sendiri.
            </p>
            <p className="text-body-md text-on-surface-variant">
              CogniFlip dirancang untuk mendukung proses tersebut melalui
              kegiatan menjelaskan, memprediksi, memeriksa, dan memperbaiki.
              Hasil evaluasi dapat membantu menunjukkan bagian yang tampaknya
              sudah dipahami dan bagian yang masih perlu diperiksa lebih lanjut.
            </p>
            <p className="text-body-md font-semibold text-on-surface">
              Gunakan hasilnya sebagai bahan percakapan dan pendampingan, bukan
              sebagai satu-satunya ukuran kemampuan anak.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="card flex flex-col items-start gap-4 p-6">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                <Icon name="family_restroom" size={30} />
              </span>
              <p className="text-body-md text-on-surface">
                Cara mendampingi, batasan AI, dan data yang disimpan dijelaskan
                di panduan.
              </p>
              <Link href="/panduan" className="btn-primary !min-h-12 w-full">
                Lihat Panduan Guru &amp; Orang Tua
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 09. FINAL CTA */}
      <section className="w-full px-4 py-16 sm:px-6 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 rounded-3xl bg-primary-container px-6 py-12 text-center text-on-primary shadow-xl sm:px-12">
          <Eyebrow tone="light">Saatnya memulai petualangan</Eyebrow>
          <h2 className="text-headline-lg-mobile sm:text-headline-lg">
            FlipBot sudah punya banyak pertanyaan. Sekarang, giliran kamu!
          </h2>
          <p className="max-w-2xl text-body-lg text-on-primary-container">
            Kita tidak harus memahami semuanya dalam satu hari. Pilih satu
            pelajaran, jelaskan apa yang kamu tahu, lalu temukan hal baru yang
            bisa kamu pelajari.
          </p>
          <p className="max-w-2xl text-body-md text-on-primary-container">
            Siapa tahu, dari satu kode sederhana, kamu akan menemukan ide besar
            berikutnya.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/belajar"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-secondary-container px-7 font-bold text-on-secondary-fixed shadow-[0_4px_0_0_#653e00] transition-transform active:translate-y-0.5"
            >
              <Icon name="rocket_launch" />
              Mulai Petualangan
            </Link>
            <Link
              href="/belajar#jalur"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-white/10 px-6 font-bold text-on-primary hover:bg-white/20"
            >
              <Icon name="menu_book" />
              Lihat Semua Pelajaran
            </Link>
          </div>
          <p className="text-body-sm text-on-primary-container">
            Mulai dari dasar, belajar selangkah demi selangkah.
          </p>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card flex flex-col gap-3 p-6">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
        <Icon name={icon} size={26} />
      </span>
      <h3 className="text-headline-sm text-on-surface">{title}</h3>
      <p className="text-body-md text-on-surface-variant">{body}</p>
    </div>
  );
}
