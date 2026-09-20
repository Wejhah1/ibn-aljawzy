"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { Modal } from "@/components/ui/modal";
import { AlertTriangle } from "lucide-react";

export function BarcodeScannerModal({
  onDetect,
  onClose,
}: {
  onDetect: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    let cancelled = false;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err, controls) => {
        controlsRef.current = controls;
        if (cancelled) return;
        if (result) {
          onDetect(result.getText());
          controls.stop();
        }
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر الوصول إلى الكاميرا. تأكد من منح الإذن للمتصفح.");
      });

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Modal title="مسح الباركود" onClose={onClose}>
      {error ? (
        <div className="flex flex-col items-center gap-(--space-3) py-(--space-6) text-center">
          <AlertTriangle className="text-danger" size={32} />
          <p className="text-sm font-semibold text-danger">{error}</p>
        </div>
      ) : (
        <div className="rounded-(--radius-md) overflow-hidden border-bold border-line-strong bg-ink aspect-square">
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        </div>
      )}
      <p className="text-[12px] text-ink-muted text-center mt-(--space-3)">
        وجّه الكاميرا نحو باركود بطاقة الطالب
      </p>
    </Modal>
  );
}
