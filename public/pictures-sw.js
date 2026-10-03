// Serves the pictures people drop into the page builder (D85, lib/pictures.ts). A page writes a kept
// picture as https://assets.invalid/<name>, an address that can never load anywhere else; in this browser
// this worker answers it from the pictures kept here. Every other request is left alone.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== "https://assets.invalid") return;
  event.respondWith(picture(url.pathname.slice(1)));
});

function picture(name) {
  const missing = () => new Response("", { status: 404 });
  return new Promise((resolve) => {
    const open = indexedDB.open("build-components", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("pictures");
    open.onerror = () => resolve(missing());
    open.onsuccess = () => {
      const get = open.result.transaction("pictures").objectStore("pictures").get(name);
      get.onerror = () => resolve(missing());
      get.onsuccess = () =>
        resolve(get.result ? new Response(get.result, { headers: { "Content-Type": get.result.type } }) : missing());
    };
  });
}
