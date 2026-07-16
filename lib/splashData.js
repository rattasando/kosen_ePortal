export const DEFAULT_SPLASH = {
  enabled: true,
  image: "/splash/splash1.jpg",
  title: "",
  body: "",
  ctaLabel: "",
  ctaHref: "",
  showFrequency: "always",
  delayMs: 500,
  width: "lg",
  border: true,
  radius: "none",
};

export const SPLASH_STORAGE_KEY = "kosen_splash_config";
export const SPLASH_SEED_KEY    = "kosen_splash_seed";
export const SPLASH_SEED_VER    = "v1r2";

// Keys used by the public page to track "already seen"
export const SPLASH_SEEN_SESSION_KEY = "kosen_splash_seen_session";
export const SPLASH_SEEN_DATE_KEY    = "kosen_splash_seen_date";
