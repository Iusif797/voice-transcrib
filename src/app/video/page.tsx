import { VideoRecorderView } from "@/features/video/VideoRecorderView";

export default function VideoPage() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-5 md:px-8 py-8 md:py-12">
      <VideoRecorderView />
    </main>
  );
}
