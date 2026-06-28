import { useCallback, useState } from "react";
import { BlurCanvas } from "../components/BlurCanvas";
import { Camera } from "../components/Camera";
import { StatusCard } from "../components/StatusCard";
import { useCamera } from "../hooks/useCamera";
import { useHandDetection } from "../hooks/useHandDetection";
import { usePeaceAudio } from "../hooks/usePeaceAudio";

export function Home() {
  const { videoRef, stream, error, startCamera } = useCamera();
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const { handDetected, peaceDetected, status } = useHandDetection(video);
  const { unlockAudio, audioError } = usePeaceAudio(peaceDetected);

  const connectVideo = useCallback(
    (element: HTMLVideoElement | null) => {
      videoRef.current = element;
      setVideo(element);
    },
    [videoRef],
  );

  const activateCamera = useCallback(() => {
    unlockAudio();
    void startCamera();
  }, [startCamera, unlockAudio]);

  return (
    <main>
      <h1>BlurCam AI</h1>
      <p>Tunjukkan pose peace ✌️ untuk membuat kamera perlahan menjadi blur.</p>
      <div hidden={!stream}>
        <Camera videoRef={connectVideo} />
        <BlurCanvas video={video} active={peaceDetected} />
      </div>
      {!stream && <button onClick={activateCamera}>Aktifkan kamera</button>}
      <StatusCard
        message={
          error ??
          (audioError
            ? "Kamera aktif, tetapi backsound tidak dapat dimuat."
            :
          (status === "loading"
            ? "Menyiapkan detektor..."
            : status === "error"
              ? "Detektor tidak dapat dimuat."
              : peaceDetected
                ? "Pose peace terdeteksi — blur aktif ✌️"
                : handDetected
                  ? "Tangan terlihat. Coba pose peace ✌️"
                  : "Kamera normal — tunjukkan pose peace ✌️"))
        }
      />
    </main>
  );
}
