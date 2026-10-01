import { crc32, deflateRawSync } from "node:zlib";

/**
 * A .zip of text files, for the Next.js project download (D80). Server only. Node's zlib does the
 * compressing and the checksums; this only lays out the headers the format asks for.
 * ponytail: no zip64, so 65,535 files and 4 GB at most; a generated project is a dozen small files.
 */
export function zip(files: Record<string, string>) {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const [name, text] of Object.entries(files)) {
    const path = new TextEncoder().encode(name);
    const data = new TextEncoder().encode(text);
    const packed = deflateRawSync(data);
    const sum = crc32(data);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true); // version needed
    local.setUint16(6, 0x0800, true); // names are UTF-8
    local.setUint16(8, 8, true); // deflate
    local.setUint16(12, 0x21, true); // 1 January 1980: a generated file has no meaningful date
    local.setUint32(14, sum, true);
    local.setUint32(18, packed.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, path.length, true);
    chunks.push(new Uint8Array(local.buffer), path, packed);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(10, 8, true);
    entry.setUint16(14, 0x21, true);
    entry.setUint32(16, sum, true);
    entry.setUint32(20, packed.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, path.length, true);
    entry.setUint32(42, offset, true);
    central.push(new Uint8Array(entry.buffer), path);

    offset += 30 + path.length + packed.length;
  }

  const size = central.reduce((total, chunk) => total + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, Object.keys(files).length, true);
  end.setUint16(10, Object.keys(files).length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);

  return Buffer.concat([...chunks, ...central, new Uint8Array(end.buffer)]);
}
