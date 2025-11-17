import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const BaseAlert = ({ config = {}, message, onClose, autoClose = 4000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const [ripples, setRipples] = useState([]);
  const [particles, setParticles] = useState([]);

  const visibleTimeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const {
    icon: Icon = () => null,
    shadow = "rgba(0,0,0,0.4)",
    showRipples = false,
    showParticles = false,
    primary = "#fff",
    secondary = "#bbb",
    gradient = "#7c3aed",
  } = config;

  useEffect(() => {
    visibleTimeoutRef.current = setTimeout(() => setIsVisible(true), 10);

    if (showParticles) {
      const newParticles = Array.from({ length: 10 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        delay: i * 0.1,
        angle: i * 36,
        distance: 40 + Math.random() * 30,
      }));
      setParticles(newParticles);
    }

    if (autoClose) {
      const startTime = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min(100, (elapsed / autoClose) * 100);
        setProgress(newProgress);
        if (newProgress >= 100) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          handleClose();
        }
      }, 100);
    }

    return () => {
      clearTimeout(visibleTimeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoClose, showParticles]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 400);
  };

  const createRipple = (e) => {
    if (!showRipples) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 900);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={createRipple}
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 transform 
        ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        }`}
      style={{
        minWidth: 300,
        maxWidth: 420,
        background: "rgba(15, 23, 42, 0.95)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: `0 10px 30px ${shadow}`,
        cursor: showRipples ? "pointer" : "default",
      }}
    >
      {showRipples &&
        ripples.map((r) => (
          <div
            key={r.id}
            className="absolute rounded-full animate-ping"
            style={{
              left: r.x,
              top: r.y,
              width: 10,
              height: 10,
              background: primary,
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          />
        ))}

      {showParticles &&
        particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: secondary,
              left: "50%",
              top: "50%",
              animation: `baseAlertFloat 3s ease-in-out ${p.delay}s infinite`,
              pointerEvents: "none",
            }}
          />
        ))}

      <div className="relative z-10 p-5 flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: gradient }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1">
          <p className="text-sm text-gray-200">{message}</p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="h-1 bg-gray-700">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: gradient,
          }}
        />
      </div>

      <style>{`
        @keyframes baseAlertFloat {
          0% { transform: translate(-50%, -50%) translateY(0) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) translateY(-20px) scale(1); opacity: 0.8; }
          100% { transform: translate(-50%, -50%) translateY(0) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BaseAlert;
