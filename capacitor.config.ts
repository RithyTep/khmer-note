import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.camnova.app",
  appName: "Camnova",
  webDir: "public",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#18181b",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1000,
      backgroundColor: "#18181b",
      showSpinner: false,
    },
    Browser: {
      // Use SFSafariViewController for OAuth
    },
  },
};

export default config;
