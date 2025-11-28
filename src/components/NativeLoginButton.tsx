"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

interface NativeLoginButtonProps {
  provider: string;
  children: React.ReactNode;
  className?: string;
}

export function NativeLoginButton({ provider, children, className }: NativeLoginButtonProps) {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  const handleNativeLogin = async () => {
    // Open login in Safari which supports OAuth
    const loginUrl = `${window.location.origin}/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent(window.location.origin)}`;

    await Browser.open({
      url: loginUrl,
      presentationStyle: "popover",
    });
  };

  if (isNative) {
    return (
      <button
        type="button"
        onClick={handleNativeLogin}
        className={className}
      >
        {children}
      </button>
    );
  }

  // On web, use the normal form submission
  return null;
}
