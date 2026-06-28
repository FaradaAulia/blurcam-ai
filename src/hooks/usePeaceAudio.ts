import { useCallback, useEffect, useRef, useState } from "react";

const AUDIO_URL = `${import.meta.env.BASE_URL}audio/foto-kita-blur.mp3`;
// Cue chorus pembuka. Geser angka ini bila versi audio memiliki intro berbeda.
const CUE_TIME_SECONDS = 24;

export function usePeaceAudio(active: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  const unlockAudio = useCallback(() => {
    if (contextRef.current) {
      void contextRef.current.resume();
      return;
    }

    const context = new AudioContext();
    contextRef.current = context;
    void context.resume();

    void fetch(AUDIO_URL)
      .then((response) => {
        if (!response.ok) throw new Error("Audio tidak ditemukan");
        return response.arrayBuffer();
      })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        bufferRef.current = buffer;
        setReady(true);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    const context = contextRef.current;
    const buffer = bufferRef.current;

    if (active && ready && context && buffer && !sourceRef.current) {
      const source = context.createBufferSource();
      const gain = context.createGain();
      const now = context.currentTime;

      source.buffer = buffer;
      source.connect(gain).connect(context.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.75, now + 0.35);
      source.start(0, Math.min(CUE_TIME_SECONDS, buffer.duration - 0.1));
      source.addEventListener("ended", () => {
        if (sourceRef.current === source) sourceRef.current = null;
      });

      sourceRef.current = source;
      gainRef.current = gain;
    }

    if (!active && sourceRef.current && gainRef.current && context) {
      const source = sourceRef.current;
      const gain = gainRef.current;
      const now = context.currentTime;

      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.18);
      source.stop(now + 0.2);
      sourceRef.current = null;
      gainRef.current = null;
    }
  }, [active, ready]);

  useEffect(
    () => () => {
      sourceRef.current?.stop();
      void contextRef.current?.close();
    },
    [],
  );

  return { unlockAudio, audioReady: ready, audioError: error };
}
