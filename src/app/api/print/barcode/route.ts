import { NextRequest, NextResponse } from "next/server";
import bwipjs from "bwip-js/node";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") ?? "000";
  const png = await bwipjs.toBuffer({
    bcid: "code128",
    text: code,
    scale: 3,
    height: 10,
    includetext: true,
    textxalign: "center",
  });
  return new NextResponse(png as unknown as BodyInit, {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=3600" },
  });
}
