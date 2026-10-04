/** Tells the counter (app/api/count, D90) that something was copied or downloaded in the browser. */
export function countInBrowser(event: "copy" | "download", name: string) {
  navigator.sendBeacon?.("/api/count", JSON.stringify({ event, name }));
}
