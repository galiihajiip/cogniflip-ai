import "server-only";

import {
  ERROR_CODES,
  type ErrorCode,
  type ErrorEnvelope,
  type SafeDetails,
} from "@/shared/api/errors";

// Codes, details and the envelope shape are defined once in src/shared/api.
export { ERROR_CODES };
export type { ErrorCode, ErrorEnvelope, SafeDetails };

interface ErrorDefinition {
  status: number;
  retryable: boolean;
  /** Plain Indonesian for elementary-school learners. Never includes internals. */
  message: string;
}

export const ERROR_DEFINITIONS: Record<ErrorCode, ErrorDefinition> = {
  VALIDATION_ERROR: {
    status: 400,
    retryable: false,
    message: "Ada isian yang belum sesuai. Coba periksa lagi, ya.",
  },
  UNAUTHENTICATED: {
    status: 401,
    retryable: false,
    message: "Kamu perlu masuk dulu untuk melanjutkan.",
  },
  INVALID_CREDENTIALS: {
    status: 401,
    retryable: false,
    // Neutral: never says whether the handle exists.
    message: "Nama pengguna atau kata sandi belum cocok. Coba lagi.",
  },
  FORBIDDEN: {
    status: 403,
    retryable: false,
    message: "Kamu tidak punya izin untuk membuka bagian ini.",
  },
  NOT_FOUND: {
    status: 404,
    retryable: false,
    message: "Yang kamu cari tidak ditemukan.",
  },
  CONFLICT: {
    status: 409,
    retryable: true,
    message: "Datanya baru saja berubah. Muat ulang lalu coba lagi.",
  },
  RATE_LIMITED: {
    status: 429,
    retryable: true,
    message: "Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.",
  },
  PROVIDER_UNAVAILABLE: {
    status: 503,
    retryable: true,
    message:
      "Fitur ini sedang tidak tersedia. Jawabanmu tidak dinilai, jadi tidak ada nilai yang hilang.",
  },
  PROVIDER_TIMEOUT: {
    status: 504,
    retryable: true,
    message:
      "Teman AI terlalu lama menjawab. Jawabanmu belum dinilai. Coba lagi, ya.",
  },
  INVALID_MODEL_OUTPUT: {
    status: 502,
    retryable: true,
    message:
      "Teman AI memberi jawaban yang tidak bisa dipakai. Jawabanmu belum dinilai. Coba lagi, ya.",
  },
  ASSESSMENT_INSUFFICIENT_EVIDENCE: {
    status: 422,
    retryable: false,
    message:
      "Penjelasanmu belum cukup untuk dinilai. Coba tambahkan sedikit lagi.",
  },
  UNSUPPORTED_TOOLCHAIN: {
    status: 422,
    retryable: false,
    message:
      "Bahasa ini belum bisa dijalankan di sini. Kamu tetap bisa meminta saran AI.",
  },
  EXECUTION_REJECTED: {
    status: 422,
    retryable: false,
    message: "Kode ini tidak bisa dijalankan karena aturan keamanan.",
  },
  EXECUTION_TIMEOUT: {
    status: 422,
    retryable: false,
    message: "Kode berjalan terlalu lama, jadi dihentikan.",
  },
  ROOM_EXPIRED: {
    status: 410,
    retryable: false,
    message: "Ruang ini sudah ditutup.",
  },
  ROOM_VERSION_CONFLICT: {
    status: 409,
    retryable: true,
    message: "Ruang baru saja diperbarui. Muat ulang lalu coba lagi.",
  },
  CONTENT_RESTRICTED: {
    status: 422,
    retryable: false,
    message: "Isi ini tidak bisa ditampilkan karena aturan keamanan.",
  },
  INTERNAL_ERROR: {
    status: 500,
    retryable: true,
    message: "Ada masalah di sistem kami. Coba lagi sebentar lagi.",
  },
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly details?: SafeDetails;

  /**
   * @param internalMessage Logged on the server only; never sent to the client.
   */
  constructor(
    code: ErrorCode,
    internalMessage: string,
    options: { details?: SafeDetails; cause?: unknown } = {},
  ) {
    super(internalMessage, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.details = options.details;
  }
}
