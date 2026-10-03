/*
 * Pictures people drop into the page builder (D85). There are no accounts, so a picture lives in this
 * browser (IndexedDB) and goes out in the downloads. In a page it is written as an address that can never
 * load anywhere (`.invalid` is a reserved domain), so it passes every check a picture address goes through
 * and survives being saved and shared. The builder shows the real picture in its place; the downloads put
 * the file there instead; anything else (the install command, someone else's browser) gets an empty
 * address, which every part draws as its placeholder.
 */

export const PICTURE_ORIGIN = "https://assets.invalid/";
const types: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/avif": "avif" };
export const ACCEPTED_PICTURES = Object.keys(types);
export const MAX_PICTURE_BYTES = 8 * 1024 * 1024;
const pattern = /https:\/\/assets\.invalid\/[a-z0-9]{16}\.(?:png|jpg|webp|gif|avif)/g;

/** The file name a picture address stands for, e.g. "3f9a…c1.png". */
export const pictureName = (address: string) => address.slice(PICTURE_ORIGIN.length);

/** Every picture address in a value (a page is plain JSON). */
export function picturesIn(value: unknown): string[] {
  return [...new Set(JSON.stringify(value).match(pattern) ?? [])];
}

/** The value with each picture address replaced: by a shown address, a file path, or "" for none. */
export function swapPictures<T>(value: T, to: (address: string) => string): T {
  return JSON.parse(JSON.stringify(value).replace(pattern, (address) => JSON.stringify(to(address)).slice(1, -1)));
}

function store(mode: IDBTransactionMode) {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    const request = indexedDB.open("build-components", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("pictures");
    request.onsuccess = () => resolve(request.result.transaction("pictures", mode).objectStore("pictures"));
    request.onerror = () => reject(request.error);
  });
}

/** Keeps a picture in this browser and returns the address the page uses for it. Throws a sentence to show. */
export async function savePicture(file: File) {
  const extension = types[file.type];
  if (!extension) throw new Error("That file is not a picture this can use: PNG, JPEG, WebP, GIF or AVIF.");
  if (file.size > MAX_PICTURE_BYTES) throw new Error("That picture is over 8 MB. Make it smaller and try again.");
  const name = `${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}.${extension}`;
  try {
    const pictures = await store("readwrite");
    await new Promise((resolve, reject) => {
      const request = pictures.put(file, name);
      request.onsuccess = resolve;
      request.onerror = () => reject(request.error);
    });
  } catch {
    throw new Error("This browser is not letting the page keep pictures (private browsing can do that). Use a picture's web address instead.");
  }
  return PICTURE_ORIGIN + name;
}

/** The picture kept for an address, if this browser has it. */
export async function loadPicture(address: string): Promise<Blob | undefined> {
  try {
    const pictures = await store("readonly");
    return await new Promise((resolve) => {
      const request = pictures.get(pictureName(address));
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => resolve(undefined);
    });
  } catch {
    return undefined;
  }
}
