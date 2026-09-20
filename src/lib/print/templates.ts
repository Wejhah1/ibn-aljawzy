import type { CertificateConfig, CertificateData, StudentCardConfig, StudentCardData } from "@/lib/print/types";

const TOKENS = {
  surface: "#f7f7f3",
  surfaceRaised: "#ffffff",
  ink: "#171b18",
  inkMuted: "#5c6862",
  inkSage: "#6f7974",
  brand: "#0e6b4f",
  brandSoft: "#e4f3ec",
  onBrand: "#ffffff",
  accentSolid: "#bc9b6a",
  accent: "#8a6a34",
  onAccent: "#171b18",
  line: "#e2e5dc",
  lineStrong: "#171b18",
};

function baseHead(scriptFontDataUri: string) {
  return `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @font-face {
      font-family: 'Year of Handicrafts';
      src: url('${scriptFontDataUri}') format('opentype');
      font-weight: 400 700;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'IBM Plex Sans Arabic', sans-serif; direction: rtl; }
  </style>
  `;
}

export function buildCertificateHtml(
  data: CertificateData,
  config: CertificateConfig,
  scriptFontDataUri: string,
  logoDataUri: string
) {
  const isLandscape = config.orientation === "landscape";
  const w = isLandscape ? "297mm" : "210mm";
  const h = isLandscape ? "210mm" : "297mm";

  const bodyText = config.bodyText
    .replace("{program}", data.programName)
    .replace("{mosque}", data.mosqueName);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" />${baseHead(scriptFontDataUri)}</head>
<body style="background:${TOKENS.surface};">
  <div style="width:${w};height:${h};position:relative;background:${TOKENS.surfaceRaised};border:10px solid ${TOKENS.accentSolid};padding:16mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
    <div style="position:absolute;inset:6mm;border:1.5px solid ${TOKENS.accent};pointer-events:none;"></div>

    ${config.showLogo ? `<div style="width:22mm;height:22mm;border-radius:50%;background:${TOKENS.surfaceRaised};display:flex;align-items:center;justify-content:center;margin-bottom:8mm;border:2px solid ${TOKENS.ink};padding:2mm;box-sizing:border-box;"><img src="${logoDataUri}" style="width:100%;height:100%;object-fit:contain;" /></div>` : ""}

    <h1 style="font-family:'Year of Handicrafts',serif;font-size:${config.titleFontSize}px;color:${TOKENS.accent};font-weight:700;margin-bottom:10mm;">
      ${config.titleText}
    </h1>

    <p style="font-size:${config.bodyFontSize}px;color:${TOKENS.inkMuted};margin-bottom:6mm;">${bodyText}</p>

    <p style="font-family:'Year of Handicrafts',serif;font-size:${config.nameFontSize}px;color:${TOKENS.ink};font-weight:700;margin-bottom:8mm;border-bottom:2px solid ${TOKENS.accentSolid};padding-bottom:4mm;min-width:60mm;">
      ${data.studentName}
    </p>

    <p style="font-size:16px;color:${TOKENS.ink};font-weight:600;margin-bottom:4mm;">${data.achievementLabel}</p>
    <p style="font-size:13px;color:${TOKENS.inkMuted};">${data.seasonName} · ${data.dateLabel}</p>

    ${
      config.showSignatureLine
        ? `<div style="position:absolute;bottom:16mm;left:16mm;right:16mm;display:flex;justify-content:space-between;">
      <div style="text-align:center;">
        <div style="width:45mm;border-top:1.5px solid ${TOKENS.ink};margin-bottom:2mm;"></div>
        <p style="font-size:12px;color:${TOKENS.inkMuted};">${config.signatureLabel}</p>
      </div>
      <div style="text-align:center;">
        <div style="width:45mm;border-top:1.5px solid ${TOKENS.ink};margin-bottom:2mm;"></div>
        <p style="font-size:12px;color:${TOKENS.inkMuted};">${config.secondSignatureLabel}</p>
      </div>
    </div>`
        : ""
    }
  </div>
</body>
</html>`;
}

export function buildStudentCardHtml(
  data: StudentCardData,
  config: StudentCardConfig,
  scriptFontDataUri: string,
  barcodeDataUri: string | null,
  logoDataUri: string
) {
  const w = "85.6mm";
  const h = "54mm";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" />${baseHead(scriptFontDataUri)}</head>
<body style="background:${TOKENS.surface};">
  <div style="width:${w};height:${h};position:relative;background:linear-gradient(135deg,${TOKENS.accentSolid} 0%,${TOKENS.accentSolid} 38%,${TOKENS.surfaceRaised} 38%);border:2px solid ${TOKENS.ink};border-radius:3mm;overflow:hidden;display:flex;">
    <div style="width:38%;padding:4mm;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${TOKENS.onAccent};text-align:center;">
      <div style="width:14mm;height:14mm;border-radius:50%;background:${TOKENS.surfaceRaised};display:flex;align-items:center;justify-content:center;margin-bottom:3mm;border:1.5px solid ${TOKENS.ink};padding:1.5mm;box-sizing:border-box;"><img src="${logoDataUri}" style="width:100%;height:100%;object-fit:contain;" /></div>
      <p style="font-family:'Year of Handicrafts',serif;font-size:15px;font-weight:700;">بطاقة الطالب</p>
    </div>
    <div style="flex:1;padding:4mm;display:flex;flex-direction:column;">
      <p style="font-family:'Year of Handicrafts',serif;font-size:14px;font-weight:700;color:${TOKENS.brand};">${data.programName}</p>
      <p style="font-family:'Year of Handicrafts',serif;font-size:10px;color:${TOKENS.inkSage};margin-bottom:3mm;">${data.mosqueName}</p>
      <p style="font-family:'Year of Handicrafts',serif;font-size:17px;font-weight:700;color:${TOKENS.ink};margin-bottom:2mm;">${data.studentName}</p>
      <p style="font-size:10px;color:${TOKENS.inkMuted};font-family:monospace;">كود: ${data.code}</p>
      ${data.circleName ? `<p style="font-size:9px;color:${TOKENS.inkMuted};">${data.circleName}</p>` : ""}
      ${config.showBirthDate && data.birthDate ? `<p style="font-size:9px;color:${TOKENS.inkMuted};">الميلاد: ${data.birthDate}</p>` : ""}
      ${config.showAddress && data.address ? `<p style="font-size:9px;color:${TOKENS.inkMuted};">${data.address}</p>` : ""}
      ${
        barcodeDataUri
          ? `<div style="margin-top:auto;text-align:center;"><img src="${barcodeDataUri}" style="width:100%;height:10mm;object-fit:contain;" /></div>`
          : ""
      }
    </div>
  </div>
</body>
</html>`;
}
