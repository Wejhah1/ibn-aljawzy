export interface CertificateConfig {
  orientation: "portrait" | "landscape";
  titleText: string;
  bodyText: string;
  showLogo: boolean;
  showSignatureLine: boolean;
  signatureLabel: string;
  secondSignatureLabel: string;
  titleFontSize: number;
  bodyFontSize: number;
  nameFontSize: number;
}

export const DEFAULT_CERTIFICATE_CONFIG: CertificateConfig = {
  orientation: "landscape",
  titleText: "شهادة تقدير",
  bodyText: "تتقدم إدارة {program} بمسجد {mosque} بخالص الشكر والتقدير للطالب",
  showLogo: true,
  showSignatureLine: true,
  signatureLabel: "مدير البرنامج",
  secondSignatureLabel: "المشرف العام",
  titleFontSize: 44,
  bodyFontSize: 18,
  nameFontSize: 34,
};

export interface StudentCardConfig {
  showQrOrBarcode: "barcode" | "qr" | "none";
  showAddress: boolean;
  showBirthDate: boolean;
}

export const DEFAULT_CARD_CONFIG: StudentCardConfig = {
  showQrOrBarcode: "barcode",
  showAddress: false,
  showBirthDate: true,
};

export interface CertificateData {
  studentName: string;
  programName: string;
  mosqueName: string;
  seasonName: string;
  achievementLabel: string;
  dateLabel: string;
}

export interface StudentCardData {
  studentName: string;
  code: string;
  programName: string;
  mosqueName: string;
  circleName: string | null;
  birthDate: string | null;
  address: string | null;
}
