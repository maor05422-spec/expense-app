// Service worker מינימלי - מטרתו היחידה היא לאפשר "התקנה למסך הבית" (PWA installability).
// לא עושה caching אגרסיבי של דפי הדשבורד (שהם דינמיים ותלויי-התחברות) כדי לא להציג
// נתונים לא מעודכנים/שגויים כשיש רשת. שומר רק כמה קבצים סטטיים לשימוש offline בסיסי.

const CACHE_NAME = "tazkiv-habait-v1";
const PRECACHE_URLS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// אסטרטגיה: network-first לכל בקשה, עם נפילה לקאש רק לקבצים הסטטיים שנשמרו למעלה.
// כך הדשבורד עצמו תמיד טרי כשיש רשת, ולא "נתקע" על נתונים ישנים.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((res) => res || Response.error()))
  );
});
