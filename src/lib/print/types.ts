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
  bgColor: string;
  textColor: string;
  accentColor: string;
  barcodeColor: string;
  showCircle: boolean;
  showGroup: boolean;
  showSecondaryLogo: boolean;
  logoSize: number;
}

export const DEFAULT_CARD_CONFIG: StudentCardConfig = {
  bgColor: "#ffffff",
  textColor: "#171b18",
  accentColor: "#0e6b4f",
  barcodeColor: "#171b18",
  showCircle: true,
  showGroup: false,
  showSecondaryLogo: false,
  logoSize: 90,
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
  groupName: string | null;
  secondaryLogoUrl: string | null;
}
