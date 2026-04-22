import { VideoRecorderView } from "@/features/video/VideoRecorderView";

export default function VideoPage() {
  return (
    <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <VideoRecorderView />
    </main>
  );
}
