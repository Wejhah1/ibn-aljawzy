"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({
  value,
  width = 2.2,
  height = 38,
  color = "#171b18",
  displayValue = true,
  fontSize = 14,
}: {
  value: string;
  width?: number;
  height?: number;
  color?: string;
  displayValue?: boolean;
  fontSize?: number;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const padded = String(value ?? "").padStart(3, "0");

  useEffect(() => {
    if (!ref.current || !padded) return;
    try {
      JsBarcode(ref.current, padded, {
        format: "CODE128",
        width,
        height,
        displayValue,
        fontSize,
        lineColor: color,
        background: "transparent",
        margin: 4,
        font: "IBM Plex Sans Arabic, sans-serif",
      });
    } catch (e) {
      console.error("Barcode error", e);
    }
  }, [padded, width, height, color, displayValue, fontSize]);

  return <svg ref={ref} />;
}
