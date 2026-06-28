import {
  FilesetResolver,
  HandLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type DetectionStatus = "idle" | "loading" | "ready" | "error";

export type HandDetection = {
  handDetected: boolean;
  peaceDetected: boolean;
};

let detectorPromise: Promise<HandLandmarker> | null = null;

function createDetector() {
  const baseUrl = import.meta.env.BASE_URL;

  return FilesetResolver.forVisionTasks(`${baseUrl}mediapipe/wasm`).then(
    (vision) =>
      HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `${baseUrl}models/hand_landmarker.task`,
        },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      }),
  );
}

function distance(a: NormalizedLandmark, b: NormalizedLandmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function angle(
  a: NormalizedLandmark,
  vertex: NormalizedLandmark,
  c: NormalizedLandmark,
) {
  const ab = { x: a.x - vertex.x, y: a.y - vertex.y, z: a.z - vertex.z };
  const cb = { x: c.x - vertex.x, y: c.y - vertex.y, z: c.z - vertex.z };
  const dot = ab.x * cb.x + ab.y * cb.y + ab.z * cb.z;
  const magnitude = Math.hypot(ab.x, ab.y, ab.z) * Math.hypot(cb.x, cb.y, cb.z);

  return Math.acos(Math.max(-1, Math.min(1, dot / magnitude))) * (180 / Math.PI);
}

function fingerIsExtended(
  landmarks: NormalizedLandmark[],
  mcp: number,
  pip: number,
  tip: number,
) {
  const straight = angle(landmarks[mcp], landmarks[pip], landmarks[tip]) > 150;
  const reachingOut =
    distance(landmarks[tip], landmarks[0]) >
    distance(landmarks[pip], landmarks[0]) * 1.12;

  return straight && reachingOut;
}

function isPeacePose(landmarks: NormalizedLandmark[]) {
  const indexExtended = fingerIsExtended(landmarks, 5, 6, 8);
  const middleExtended = fingerIsExtended(landmarks, 9, 10, 12);
  const ringExtended = fingerIsExtended(landmarks, 13, 14, 16);
  const pinkyExtended = fingerIsExtended(landmarks, 17, 18, 20);
  const palmWidth = distance(landmarks[5], landmarks[17]);
  const fingersApart = distance(landmarks[8], landmarks[12]) > palmWidth * 0.35;

  return indexExtended && middleExtended && !ringExtended && !pinkyExtended && fingersApart;
}

export async function detectHand(video: HTMLVideoElement): Promise<HandDetection> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    return { handDetected: false, peaceDetected: false };
  }

  detectorPromise ??= createDetector();
  const detector = await detectorPromise;
  const result = detector.detectForVideo(video, performance.now());
  const landmarks = result.landmarks[0];

  return {
    handDetected: Boolean(landmarks),
    peaceDetected: landmarks ? isPeacePose(landmarks) : false,
  };
}
