"use client";

import { motion } from "framer-motion";
// import { Mic } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

// Define the color scheme type
interface ColorScheme {
  gradient1: string[];
  gradient2: string[];
  blob1: string;
  blob2: string;
  blob3: string;
  blob4: string;
}

// Define the props for the component
interface AudioVisualizerButtonProps {
  onClick?: () => void;
  color?: "blue" | "purple" | "orange";
}

const AudioVisualizerButton: React.FC<AudioVisualizerButtonProps> = ({
  onClick,
  color = "blue",
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  // Color schemes
  const colorSchemes: { [key: string]: ColorScheme } = {
    blue: {
      gradient1: ["#48c6ef", "#6f86d6"],
      gradient2: ["#9795f0", "#9be15d"],
      blob1: "#984ddf",
      blob2: "#4344ad",
      blob3: "#74d9e1",
      blob4: "#050515",
    },
    purple: {
      gradient1: ["#984ddf", "#4344ad"],
      gradient2: ["#74d9e1", "#050515"],
      blob1: "#bb74ff",
      blob2: "#7c7dff",
      blob3: "#a0f8ff",
      blob4: "#ffffff",
    },
    orange: {
      gradient1: ["#f6d365", "#fda085"],
      gradient2: ["#ff8c42", "#fcaf58"],
      blob1: "#ff8c42",
      blob2: "#fcaf58",
      blob3: "#f9c784",
      blob4: "#ffffff",
    },
  };

  const selectedScheme: ColorScheme = colorSchemes[color] || colorSchemes.blue;

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyserNode: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;

    const setupAudio = async () => {
      try {
        audioCtx = new (window.AudioContext || window.AudioContext)();
        analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 64;
        analyserNode.smoothingTimeConstant = 0.8;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyserNode);

        setAudioContext(audioCtx);
        setAnalyser(analyserNode);
        setFrequencyData(new Uint8Array(analyserNode.frequencyBinCount));
      } catch (error) {
        console.error("Error accessing microphone:", error);
      }
    };

    if (isHovered) {
      setupAudio();
    }

    return () => {
      if (source) {
        source.disconnect();
      }
      if (analyserNode) {
        analyserNode.disconnect();
      }
      if (audioCtx) {
        audioCtx.close();
      }
    };
  }, [isHovered, color]);

  useEffect(() => {
    if (!analyser || !audioContext || !frequencyData) return;

    let animationFrameId: number;

    const animateVisualization = () => {
      if (!analyser || !audioContext || !frequencyData) return;

      analyser.getByteFrequencyData(frequencyData);

      // Calculate average frequency
      let sum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      const average = sum / frequencyData.length;

      // Map average frequency to amplitude, adjust range
      const amplitude = 1 + (average / 256) * 0.5;

      // Apply amplitude to blob scale

      const blobs = document.querySelectorAll<SVGPathElement>(".blob path");

      blobs.forEach((blob) => {
        const originalScale = parseFloat(
          blob.getAttribute("data-original-scale") || "0.8"
        ); // Get original scale

        blob.setAttribute("transform", `scale(${originalScale * amplitude})`);
      });
      animationFrameId = requestAnimationFrame(animateVisualization);
    };

    animateVisualization();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [analyser, audioContext, frequencyData]);

  const handleClick = () => {
    if (onClick) onClick();
  };

  const blobStyle = {
    "--blob-1": selectedScheme.blob1,
    "--blob-2": selectedScheme.blob2,
    "--blob-3": selectedScheme.blob3,
    "--blob-4": selectedScheme.blob4,
    "--bg-0": "transparent",
    "--bg-1": "transparent",
  };

  return (
    <motion.div
      ref={buttonRef}
      className="relative w-24 h-24 lg:w-24 lg:h-24 flex items-center justify-center cursor-pointer rounded-full overflow-hidden"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="container palette-1 absolute inset-0"
        style={blobStyle as React.CSSProperties}
      >
        {/* Microphone icon in the center with animation */}
        {/* <div className="absolute inset-0 flex items-center justify-center z-10">
          <Mic
            className={`w-4 h-4 ${
              color === "blue"
                ? "text-white opacity-70"
                : "text-black opacity-70"
            }`}
          />
        </div> */}

        <div className="blobs">
          <svg viewBox="0 0 1200 1200">
            <g className="blob blob-1">
              <path
                data-original-scale="0.8"
                d="M 100 600 q 0 -500, 500 -500 t 500 500 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-2">
              <path
                data-original-scale="0.78"
                d="M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-3">
              <path
                data-original-scale="0.76"
                d="M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-4">
              <path
                data-original-scale="0.5"
                d="M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z"
              />
            </g>
            <g className="blob blob-1 alt">
              <path
                data-original-scale="0.8"
                d="M 100 600 q 0 -500, 500 -500 t 500 500 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-2 alt">
              <path
                data-original-scale="0.78"
                d="M 100 600 q -50 -400, 500 -500 t 450 550 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-3 alt">
              <path
                data-original-scale="0.76"
                d="M 100 600 q 0 -400, 500 -500 t 400 500 t -500 500 T 100 600 z"
              />
            </g>
            <g className="blob blob-4 alt">
              <path
                data-original-scale="0.5"
                d="M 150 600 q 0 -600, 500 -500 t 500 550 t -500 500 T 150 600 z"
              />
            </g>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default AudioVisualizerButton;
