import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.soheee.logit",
  appName: "Logit",
  webDir: "out",
  server: {
    // iOS에서 로컬 파일 로드 시 필요
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
