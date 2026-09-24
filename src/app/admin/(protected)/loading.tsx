import { LottieLoader } from "@/components/ui/lottie-loader";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LottieLoader size={160} />
    </div>
  );
}
