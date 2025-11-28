import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.camnova.app",
  appName: "Camnova",
  webDir: "public",
  server: {
    // Load the deployed web app
    url: "https://camnova.rithytep.online",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#18181b",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#18181b",
      showSpinner: true,
      spinnerColor: "#f97316",
    },
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#18181b",
    },
  },
};

export default config;
