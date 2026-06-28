import type { Ref } from "react";

type CameraProps = {
  videoRef: Ref<HTMLVideoElement>;
};

export function Camera({ videoRef }: CameraProps) {
  return <video ref={videoRef} autoPlay muted playsInline />;
}
