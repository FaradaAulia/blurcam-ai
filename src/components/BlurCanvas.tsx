import { useEffect, useRef } from "react";

type BlurCanvasProps = {
  video: HTMLVideoElement | null;
  active: boolean;
};

export function BlurCanvas({ video, active }: BlurCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    let frameId = 0;
    let currentBlur = 0;
    let previousTime = performance.now();

    const draw = (time: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");

      if (canvas && context && video?.videoWidth) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const elapsed = Math.min(time - previousTime, 100);
        const targetBlur = activeRef.current ? 22 : 0;
        // Blur tumbuh sinematik saat peace, tetapi pulih jauh lebih cepat
        // setelah tangan diturunkan.
        const transitionDuration = activeRef.current ? 650 : 160;
        const easing = 1 - Math.exp(-elapsed / transitionDuration);
        currentBlur += (targetBlur - currentBlur) * easing;
        if (Math.abs(targetBlur - currentBlur) < 0.05) currentBlur = targetBlur;

        const scale = 1 + currentBlur / 240;
        const width = canvas.width * scale;
        const height = canvas.height * scale;

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.filter = `blur(${currentBlur}px)`;
        context.drawImage(
          video,
          (canvas.width - width) / 2,
          (canvas.height - height) / 2,
          width,
          height,
        );
        context.restore();
      }

      previousTime = time;
      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [video]);

  return <canvas ref={canvasRef} />;
}
