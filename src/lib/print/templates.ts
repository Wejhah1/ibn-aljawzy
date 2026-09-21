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
  barcodeLibSource: string,
  logoDataUri: string
) {
  const accent = config.accentColor;
  const logoPx = config.logoSize / 2.2;
  const paddedCode = String(data.code ?? "").padStart(3, "0");
  const secondaryLogo =
    config.showSecondaryLogo && data.secondaryLogoUrl
      ? `<img src="${data.secondaryLogoUrl}" style="height:${logoPx}px;width:${logoPx}px;object-fit:contain;flex-shrink:0;" />`
      : `<div style="height:${logoPx}px;width:${logoPx}px;flex-shrink:0;"></div>`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8" />${baseHead(scriptFontDataUri)}</head>
<body style="background:${TOKENS.surface};">
  <div style="width:85mm;height:54mm;position:relative;overflow:hidden;border-radius:16px;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);background:${config.bgColor};color:${config.textColor};border:1px solid ${accent}33;display:flex;flex-direction:column;">
    <div style="height:8px;width:100%;flex-shrink:0;background:linear-gradient(90deg, ${accent}, ${accent}88, ${accent});"></div>

    <svg style="position:absolute;top:-24px;left:-24px;opacity:0.1;" width="90" height="90" viewBox="0 0 90 90" fill="${accent}">
      <path d="M45 5l10 25 25 10-25 10-10 25-10-25-25-10 25-10z" />
    </svg>
    <svg style="position:absolute;bottom:-32px;right:-32px;opacity:0.06;" width="120" height="120" viewBox="0 0 120 120" fill="${accent}">
      <circle cx="60" cy="60" r="50" />
    </svg>

    <div style="position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 12px 0;">
      <img src="${logoDataUri}" style="height:${logoPx}px;width:${logoPx}px;object-fit:contain;flex-shrink:0;" />
      <div style="text-align:center;flex:1;min-width:0;">
        <div style="font-size:10px;font-weight:600;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${accent};">${data.programName}</div>
        <div style="font-size:9px;opacity:0.7;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.mosqueName}</div>
      </div>
      ${secondaryLogo}
    </div>

    <div style="position:relative;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 12px;">
      <div style="font-weight:700;font-size:18px;line-height:1.25;">${data.studentName}</div>
      <div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;">
        ${
          config.showCircle && data.circleName
            ? `<span style="display:inline-block;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:500;background:${accent}22;color:${accent};">${data.circleName}</span>`
            : ""
        }
        ${
          config.showGroup && data.groupName
            ? `<span style="display:inline-block;border-radius:999px;padding:2px 10px;font-size:11px;font-weight:500;background:${accent}22;color:${accent};">${data.groupName}</span>`
            : ""
        }
      </div>
    </div>

    <div style="position:relative;display:flex;flex-direction:column;align-items:center;padding-bottom:8px;flex-shrink:0;">
      <svg id="barcode"></svg>
    </div>
  </div>
  <script>${barcodeLibSource}</script>
  <script>
    JsBarcode("#barcode", ${JSON.stringify(paddedCode)}, {
      format: "CODE128",
      width: 2.2,
      height: 38,
      fontSize: 14,
      lineColor: ${JSON.stringify(config.barcodeColor)},
      background: "transparent",
      margin: 4,
      displayValue: true,
      font: "IBM Plex Sans Arabic, sans-serif",
    });
  </script>
</body>
</html>`;
}
