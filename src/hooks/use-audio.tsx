import { useRef, useState } from "react";

export const useRecordVoice = () => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [recording, setRecording] = useState<
    "initial" | "play" | "pause" | "stop"
  >("initial");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const chunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Function to start the recording
  const startRecording = (): void => {
    if (mediaRecorder) {
      chunks.current = []; // Reset chunks when starting fresh
      mediaRecorder.start(1000); // Collect data every second
      setRecording("play");
    }
  };

  const pauseRecording = (): void => {
    if (mediaRecorder) {
      mediaRecorder.pause();
      setRecording("pause");
    }
  };

  const resumeRecording = (): void => {
    if (mediaRecorder) {
      mediaRecorder.resume();
      setRecording("play");
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording("stop");
    }
  };

  // Modify the initialMediaRecorder function to ensure consistent audio format
  const initialMediaRecorder = (stream: MediaStream): void => {
    streamRef.current = stream;
    const mimeType = "audio/webm";

    const recorder = new MediaRecorder(stream, {
      mimeType: mimeType,
    });

    recorder.onstart = () => {
      setRecording("play");
    };

    recorder.ondataavailable = (ev: BlobEvent) => {
      if (ev.data.size > 0) {
        chunks.current.push(ev.data);

        // Create a combined blob from all chunks so far
        const combinedBlob = new Blob(chunks.current, { type: mimeType });
        const combinedFile = new File([combinedBlob], "audio.webm", {
          type: mimeType,
        });

        // Update state with the full recording so far
        setAudioBlob(combinedBlob);
        setAudioFile(combinedFile);

        console.log(
          "Full recording updated, duration so far:",
          chunks.current.length,
          "seconds"
        );
      }
    };

    recorder.onstop = () => {
      setRecording("stop");
    };

    recorder.onpause = () => {
      setRecording("pause");
    };

    recorder.onresume = () => {
      setRecording("play");
    };

    recorder.start(1000);
    setMediaRecorder(recorder);
  };

  const resetRecorder = (): void => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.onstart = null;
      mediaRecorder.onpause = null;
      mediaRecorder.onresume = null;
      setMediaRecorder(null);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    chunks.current = [];
    setAudioBlob(null);
    setAudioFile(null);
    setRecording("initial");
  };

  const askForPermission = (): void => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(initialMediaRecorder);
  };

  return {
    recording,
    setRecording,
    startRecording,
    stopRecording,
    mediaRecorder,
    setMediaRecorder,
    audioBlob,
    setAudioBlob,
    audioFile,
    pauseRecording,
    resumeRecording,
    askForPermission,
    resetRecorder,
  };
};
