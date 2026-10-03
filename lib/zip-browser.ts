/*
 * A .zip made in the browser (D85): the Next.js download, with the pictures that only this browser has.
 * Stored, not compressed: the pictures are compressed already and the text is small. lib/zip.ts is the
 * server's, which compresses with Node's zlib.
 * ponytail: no zip64, so 65,535 files and 4 GB at most.
 */

const table = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(data: Uint8Array) {
  let c = 0xffffffff;
  for (const byte of data) c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function zipInBrowser(files: Record<string, string | Uint8Array>) {
  const parts: BlobPart[] = [];
  const central: BlobPart[] = [];
  let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const path = new TextEncoder().encode(name);
    const data = typeof content === "string" ? new TextEncoder().encode(content) : content;
    const sum = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // names are UTF-8
    local.setUint16(12, 0x21, true); // 1 January 1980
    local.setUint32(14, sum, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, path.length, true);
    parts.push(local.buffer, path, data as Uint8Array<ArrayBuffer>);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(14, 0x21, true);
    entry.setUint32(16, sum, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, path.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry.buffer, path);
    offset += 30 + path.length + data.length;
  }
  const size = central.reduce<number>((total, part) => total + (part as ArrayBuffer | Uint8Array).byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end.buffer], { type: "application/zip" });
}
