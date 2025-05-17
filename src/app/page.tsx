"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StopCircle,
  Trash2,
  Download,
  Moon,
  Sun,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { create } from "zustand";
import { toast } from "sonner";

import { AnimatedBackground } from "@/components/animated-background";
import AudioVisualizerButton from "@/components/ui/audio-visualizer-button";
import { useRecordVoice } from "@/hooks/use-audio";

// --- Zustand Store ---
interface AudioStore {
  uiRecordingState: "initial" | "play" | "pause" | "stop";
  fullTranscription: string;
  audioData: Float32Array;
  setUiRecordingState: (state: AudioStore["uiRecordingState"]) => void;
  setFullTranscription: (text: string) => void;
  resetFullTranscription: () => void;
  setAudioData: (data: Float32Array) => void;
  isTranscribing: boolean;
  setIsTranscribing: (state: boolean) => void;
}

const useAudioStore = create<AudioStore>((set) => ({
  uiRecordingState: "initial",
  fullTranscription: "",
  audioData: new Float32Array(64).fill(0.01),
  setUiRecordingState: (state) => set({ uiRecordingState: state }),
  setFullTranscription: (text) => set({ fullTranscription: text }),
  resetFullTranscription: () => set({ fullTranscription: "" }),
  setAudioData: (data) => set({ audioData: data }),
  isTranscribing: false,
  setIsTranscribing: (state) => set({ isTranscribing: state }),
}));

const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
if (!groqApiKey) {
  console.warn("Groq API key (NEXT_PUBLIC_GROQ_API_KEY) is missing.");
}

// --- Components ---
export default function Home() {
  /* ... Home ... */
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground overflow-hidden relative">
      <AnimatedBackground />
      <Navbar />
      <main className="flex-grow flex items-center justify-center container mx-auto z-10 w-full px-4">
        <TranscriptionDisplay />
      </main>
      <AudioVisualizerControl />
    </div>
  );
}

const audioVisualizerControlActionsRef: {
  cleanupVisualizer?: () => Promise<void>;
} = {};
const useAudioVisualizerControlActions = () => audioVisualizerControlActionsRef;

const TranscriptionDisplay = () => {
  const { fullTranscription, isTranscribing, uiRecordingState } =
    useAudioStore();
  const {
    audioBlob,
    stopRecording: hookStopRecording,
    resetRecorder: hookResetRecorder,
  } = useRecordVoice();
  const {
    resetFullTranscription: zustandResetTranscription,
    setUiRecordingState,
  } = useAudioStore();

  const [copied, setCopied] = useState(false);
  const audioVisualizerControlActions = useAudioVisualizerControlActions();

  const handleGlobalStop = useCallback(async () => {
    const currentIsTranscribing = useAudioStore.getState().isTranscribing;
    const currentUiState = useAudioStore.getState().uiRecordingState;
    console.log(
      "[DISPLAY] Global Stop. UI State:",
      currentUiState,
      "Transcribing:",
      currentIsTranscribing
    );

    // Allow stopping even during transcription
    hookStopRecording(); // Tell hook to stop its MediaRecorder
    setUiRecordingState("stop"); // Immediately update UI
    if (audioVisualizerControlActions?.cleanupVisualizer) {
      await audioVisualizerControlActions.cleanupVisualizer();
    }
  }, [hookStopRecording, audioVisualizerControlActions, setUiRecordingState]);

  const handleResetGlobal = useCallback(async () => {
    if (useAudioStore.getState().isTranscribing) {
      toast.warning("Cannot reset while processing audio.");
      return;
    }
    console.log("[DISPLAY] Global Reset.");
    await hookResetRecorder(); // Hook cleans its MR and stream
    zustandResetTranscription();
    setUiRecordingState("initial"); // Set UI state
    if (audioVisualizerControlActions?.cleanupVisualizer) {
      await audioVisualizerControlActions.cleanupVisualizer(); // Clean up visualizer's specific resources
    }
    useAudioStore.getState().setAudioData(new Float32Array(64).fill(0.01));
    toast.success("Cleared", {
      description: "Recording and transcription reset.",
    });
  }, [
    hookResetRecorder,
    zustandResetTranscription,
    setUiRecordingState,
    audioVisualizerControlActions,
  ]);

  const handleDownloadGlobal = useCallback(() => {
    /* ... same ... */
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      a.href = url;
      const extension = audioBlob.type.split("/")[1] || "wav";
      a.download = `recording-${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.${extension}`;
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
      toast.info("Download Started", { description: "Audio is downloading." });
    } else {
      toast.error("Download Failed", {
        description: "No audio data available.",
      });
    }
  }, [audioBlob]);

  const handleCopy = useCallback(async () => {
    /* ... same ... */
    if (!fullTranscription) {
      toast.info("Nothing to copy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(fullTranscription);
      setCopied(true);
      toast.success("Copied!", { description: "Transcription copied." });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy Failed", { description: "Could not copy." });
    }
  }, [fullTranscription]);

  return (
    <div className="w-full max-w-3xl p-6 pt-4 rounded-xl bg-background/80 backdrop-blur-lg border border-border shadow-2xl relative">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold tracking-tight">Transcription</h2>
        <div className="flex items-center space-x-1 sm:space-x-1.5">
          <AnimatePresence>
            {(uiRecordingState === "play" || uiRecordingState === "pause") &&
              !isTranscribing && (
                <motion.div
                  key="stop-button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleGlobalStop}
                    title="Stop Transcription"
                    className="h-8 w-8 sm:h-9 sm:w-9 text-destructive/80 hover:text-destructive"
                  >
                    <StopCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </motion.div>
              )}
            {fullTranscription && !isTranscribing && (
              <motion.div
                key="copy-button"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy"}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
            )}
            {audioBlob &&
              !isTranscribing &&
              (uiRecordingState === "stop" ||
                (uiRecordingState === "initial" && fullTranscription)) && (
                <motion.div
                  key="download-button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDownloadGlobal}
                    title="Download Audio"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            {((uiRecordingState === "stop" && fullTranscription) ||
              (uiRecordingState === "initial" && fullTranscription) ||
              audioBlob) &&
              !isTranscribing && (
                <motion.div
                  key="reset-button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleResetGlobal}
                    title="Clear All"
                    className="h-8 w-8 sm:h-9 sm:w-9"
                  >
                    <Trash2 className="h-4 w-4 text-destructive/80 hover:text-destructive" />
                  </Button>
                </motion.div>
              )}
          </AnimatePresence>
        </div>
      </div>
      {/* {isTranscribing && uiRecordingState === "play" && (
        <p className="text-sm text-primary/80 mb-2 animate-pulse absolute top-5 left-1/2 -translate-x-1/2 bg-background/50 px-2 py-0.5 rounded">
          Processing...
        </p>
      )} */}
      <div className="min-h-[250px] md:min-h-[300px] p-4 rounded-lg bg-muted/60 text-muted-foreground overflow-y-auto custom-scrollbar prose dark:prose-invert prose-sm max-w-none">
        {fullTranscription ? (
          <p className="whitespace-pre-wrap text-foreground text-base leading-relaxed">
            {fullTranscription}
          </p>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-center">
              {uiRecordingState === "initial" || uiRecordingState === "stop"
                ? "Click the below blob to start."
                : uiRecordingState === "play"
                ? "Listening..."
                : "Paused."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const Navbar = () => {
  /* ... Navbar ... */
  const { theme, setTheme } = useTheme();
  return (
    <div className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/20 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight">
              VoiceScribe
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

const AudioVisualizerControl = () => {
  const {
    uiRecordingState,
    setUiRecordingState,
    setFullTranscription,
    setAudioData,
    isTranscribing,
    setIsTranscribing,
  } = useAudioStore();

  const {
    recording,
    audioFile,
    mediaRecorder,
    askForPermission,
    startRecording: hookStartRecording,
    pauseRecording: hookPauseRecording,
    resumeRecording: hookResumeRecording,
    resetRecorder: hookResetRecorderForCleanup, // Renamed for clarity for unmount
  } = useRecordVoice();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const streamForVisualizerRef = useRef<MediaStream | null>(null);

  // Ref to store the last processed audioFile's timestamp or size to avoid re-processing identical File objects
  // if the hook provides a new File object reference for the same underlying data.
  const lastProcessedAudioFileRef = useRef<{
    name: string;
    size: number;
    lastModified: number;
  } | null>(null);

  // Add a timestamp-based tracking system for API calls
  const lastApiCallTimeRef = useRef<number>(0);
  const API_CALL_INTERVAL = 4000; // 4 seconds between API calls

  // Sync Zustand UI state with the hook's internal recording state
  useEffect(() => {
    // Only update if the hook's state is different from UI state to prevent potential loops
    if (useAudioStore.getState().uiRecordingState !== recording) {
      setUiRecordingState(recording);
    }
  }, [recording, setUiRecordingState]);

  // Update the transcribeFullAudioAPI function to handle errors better
  const transcribeFullAudioAPI = useCallback(
    async (currentAudioFile: File) => {
      console.log(
        "[TRANSCRIBE] API Call. Full recording size:",
        currentAudioFile.size
      );
      if (currentAudioFile.size < 500) {
        console.warn("File too small", currentAudioFile.size);
        return;
      }

      try {
        // Create a copy of the file to ensure it's a valid audio file
        const validAudioBlob = new Blob(
          [await currentAudioFile.arrayBuffer()],
          {
            type: "audio/webm",
          }
        );

        const validAudioFile = new File([validAudioBlob], "audio.webm", {
          type: "audio/webm",
        });

        console.log("[TRANSCRIBE] Sending file:", {
          type: validAudioFile.type,
          size: validAudioFile.size,
        });

        const formData = new FormData();
        formData.append("file", validAudioFile);

        // Use a non-blocking fetch to prevent UI interruption
        fetch("/api/transcription", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((errorData) => {
                console.error("API Error:", {
                  status: response.status,
                  error: errorData,
                });
                return { text: "" };
              });
            }
            return response.json();
          })
          .then((result) => {
            if (result.text?.trim()) {
              // Replace the entire transcription with the new full transcription
              setFullTranscription(result.text.trim());
            }
          })
          .catch((error) => {
            console.error("Transcription error:", error);
          });
      } catch (error) {
        console.error("Transcription setup error:", error);
      }
    },
    [setFullTranscription]
  ); // Dependencies for useCallback
  // Effect to handle new audioFile from the hook
  useEffect(() => {
    if (audioFile && uiRecordingState === "play") {
      const currentTime = Date.now();

      // Only call API if enough time has passed since last call
      if (currentTime - lastApiCallTimeRef.current >= API_CALL_INTERVAL) {
        console.log(
          "[CONTROL] Scheduled API call. Audio size:",
          audioFile.size,
          "Time since last call:",
          currentTime - lastApiCallTimeRef.current
        );

        // Update the last API call time
        lastApiCallTimeRef.current = currentTime;

        // Process the full recording with a slight delay to ensure file is ready
        setTimeout(() => {
          if (useAudioStore.getState().uiRecordingState === "play") {
            transcribeFullAudioAPI(audioFile);
          }
        }, 100);
      }
    }
  }, [audioFile, uiRecordingState, transcribeFullAudioAPI]);

  // Memoize visualizer functions
  const updateVisualizerData = useCallback(() => {
    if (
      analyserRef.current &&
      useAudioStore.getState().uiRecordingState === "play"
    ) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Float32Array(bufferLength);
      analyserRef.current.getFloatFrequencyData(dataArray);
      const normalizedData = dataArray.map((db) =>
        Math.max(
          0,
          Math.min(
            1,
            (db - analyserRef.current!.minDecibels) /
              (analyserRef.current!.maxDecibels -
                analyserRef.current!.minDecibels)
          )
        )
      );
      setAudioData(normalizedData);
      animationFrameIdRef.current = requestAnimationFrame(updateVisualizerData);
    } else {
      animationFrameIdRef.current = 0;
    }
  }, [setAudioData]);

  const setupVisualizer = useCallback(async () => {
    try {
      // Setup code...
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      // Rest of setup code...
    } catch (_) {
      console.error("Visualizer setup failed");
    }
  }, []);

  const cleanupVisualizer = useCallback(async () => {
    if (animationFrameIdRef.current)
      cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = 0;
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {}
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {}
      analyserRef.current = null;
    }
    if (streamForVisualizerRef.current) {
      streamForVisualizerRef.current
        .getTracks()
        .forEach((track) => track.stop());
      streamForVisualizerRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      try {
        await audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioData(new Float32Array(64).fill(0.01));
    console.log("[VISUALIZER] Cleaned up.");
  }, [setAudioData]);

  useEffect(() => {
    audioVisualizerControlActionsRef.cleanupVisualizer = cleanupVisualizer;
    return () => {
      audioVisualizerControlActionsRef.cleanupVisualizer = undefined;
    };
  }, [cleanupVisualizer]);

  useEffect(() => {
    if (uiRecordingState === "play") {
      setupVisualizer();
    } else {
      if (animationFrameIdRef.current)
        cancelAnimationFrame(animationFrameIdRef.current);
      if (uiRecordingState === "stop" || uiRecordingState === "initial") {
        cleanupVisualizer();
      }
    }
  }, [uiRecordingState, setupVisualizer, cleanupVisualizer]);

  const handleMainButtonClick = async () => {
    // Don't block UI during transcription
    if (uiRecordingState === "initial" || uiRecordingState === "stop") {
      useAudioStore.getState().resetFullTranscription();

      // Check if media devices are available
      if (!navigator.mediaDevices) {
        toast.error("Media devices not available", {
          description: "Your browser doesn't support audio recording.",
        });
        return;
      }

      try {
        // Check if we can access the microphone
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
          askForPermission(); // Hook calls initialMediaRecorder -> recorder.start(2000)
        });
      } catch (error) {
        toast.error("Microphone access denied", {
          description: "Please allow microphone access to use this feature.",
        });
      }
    } else if (uiRecordingState === "play") hookPauseRecording();
    else if (uiRecordingState === "pause") hookResumeRecording();
  };

  useEffect(() => {
    // Only run cleanup on unmount, not on every render
    return () => {
      console.log("[EFFECT][AudioVisualizerControl] Unmounting.");
      if (uiRecordingState !== "initial" && uiRecordingState !== "play") {
        // Only reset if not recording
        hookResetRecorderForCleanup();
        cleanupVisualizer();
      }
    };
  }, [hookResetRecorderForCleanup, cleanupVisualizer, uiRecordingState]); // Added missing dependencies

  // Update the useEffect for handling mediaRecorder events
  useEffect(() => {
    if (mediaRecorder && uiRecordingState === "play") {
      console.log("[CONTROL] Setting up continuous transcription");

      // Force the mediaRecorder to generate data continuously
      if (mediaRecorder.state === "inactive") {
        mediaRecorder.start(3000);
      }

      // Set up continuous data collection
      const dataHandler = (ev: BlobEvent) => {
        console.log(
          "[CONTROL] Data available event fired, size:",
          ev.data.size
        );

        // Process any data chunk with sufficient size
        if (ev.data.size > 500) {
          // Use the same MIME type consistently
          const mimeType = mediaRecorder.mimeType || "audio/webm";
          const audioBlob = new Blob([ev.data], { type: mimeType });
          const audioFile = new File([audioBlob], "audio.webm", {
            type: mimeType,
          });

          // Log the file details for debugging
          console.log("[CONTROL] Audio file details:", {
            type: audioFile.type,
            size: audioFile.size,
            name: audioFile.name,
          });

          // Process new chunks regardless of transcription state
          console.log("[CONTROL] Processing new audio chunk");
          // Use non-blocking approach to prevent component unmounting
          setTimeout(() => {
            if (useAudioStore.getState().uiRecordingState === "play") {
              transcribeFullAudioAPI(audioFile);
            }
          }, 0);
        }
      };

      mediaRecorder.addEventListener("dataavailable", dataHandler);

      // Keep the recorder active
      const keepAlive = setInterval(() => {
        if (
          mediaRecorder &&
          mediaRecorder.state === "recording" &&
          useAudioStore.getState().uiRecordingState === "play"
        ) {
          mediaRecorder.requestData();
        }
      }, 2500);

      return () => {
        mediaRecorder.removeEventListener("dataavailable", dataHandler);
        clearInterval(keepAlive);
      };
    }
  }, [mediaRecorder, uiRecordingState, transcribeFullAudioAPI]);

  // Update the AudioVisualizerControl component to allow interaction during transcription
  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-40 px-4">
      <motion.div
        className="relative flex items-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
      >
        <motion.div
          onClick={handleMainButtonClick}
          className="cursor-pointer"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          title={
            uiRecordingState === "initial" || uiRecordingState === "stop"
              ? "Start Transcription"
              : uiRecordingState === "play"
              ? "Pause Transcription"
              : "Resume Transcription"
          }
        >
          <AudioVisualizerButton
            color={
              uiRecordingState === "play"
                ? "purple"
                : uiRecordingState === "pause"
                ? "orange"
                : "blue"
            }
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
