"use client";

import { useEffect } from "react";

/** רושם את ה-service worker בשקט ברקע, כדי שהאתר יהיה ניתן ל"התקנה למסך הבית". */
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // התקנת PWA היא שיפור נחמד, לא קריטי - כשל בשקט
      });
    }
  }, []);

  return null;
}
