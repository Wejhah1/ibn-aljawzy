import "server-only";
import bwipjs from "bwip-js/node";

export async function generateBarcodeDataUri(code: string): Promise<string> {
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });
  return `data:image/png;base64,${png.toString("base64")}`;
}
