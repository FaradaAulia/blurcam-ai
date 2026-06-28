import { useEffect, useState } from "react";
import { detectHand, type DetectionStatus } from "../components/PoseDetector";

export function useHandDetection(video: HTMLVideoElement | null) {
  const [handDetected, setHandDetected] = useState(false);
  const [peaceDetected, setPeaceDetected] = useState(false);
  const [status, setStatus] = useState<DetectionStatus>("idle");

  useEffect(() => {
    if (!video) return;

    let cancelled = false;
    let timer = 0;
    let peaceFrames = 0;
    let releaseFrames = 0;
    setStatus("loading");

    const run = async () => {
      try {
        const result = await detectHand(video);
        if (!cancelled) {
          setHandDetected(result.handDetected);

          if (result.peaceDetected) {
            peaceFrames += 1;
            releaseFrames = 0;
            if (peaceFrames >= 2) setPeaceDetected(true);
          } else {
            peaceFrames = 0;
            releaseFrames += 1;
            if (releaseFrames >= 3) setPeaceDetected(false);
          }

          setStatus("ready");
          timer = window.setTimeout(run, 100);
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void run();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [video]);

  return { handDetected, peaceDetected, status };
}
