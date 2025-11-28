"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const TOAST_DURATION_MS = 2500;
const TOAST_FADE_DURATION_MS = 300;

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export function Toast({ message, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, TOAST_FADE_DURATION_MS);
      }, TOAST_DURATION_MS);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-4 py-2 rounded-md shadow-lg text-sm flex items-center gap-2 transform transition-transform duration-300 z-50 ${
        visible ? "translate-y-0" : "translate-y-32"
      }`}
    >
      <CheckCircle className="w-4 h-4 text-green-400 dark:text-green-600" />
      <span>{message}</span>
    </div>
  );
}
