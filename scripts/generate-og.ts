import fs from 'node:fs';
import zlib from 'node:zlib';

function crc32(buf: Buffer): number {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcInput);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([lenBuf, crcInput, crcBuf]);
}

const width = 1200;
const height = 630;
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(width, 0);
ihdrData.writeUInt32BE(height, 4);
ihdrData[8] = 8; // 8 bit
ihdrData[9] = 2; // RGB
ihdrData[10] = 0; // def
ihdrData[11] = 0; // def
ihdrData[12] = 0; // no interlace

const rowLen = 1 + width * 3;
const rawData = Buffer.alloc(rowLen * height);

for (let y = 0; y < height; y++) {
  const rowStart = y * rowLen;
  rawData[rowStart] = 0; // filter none
  // Gradient from deep slate (#0f172a) to emerald green (#065f46)
  const t = y / height;
  const r = Math.floor(15 * (1 - t) + 6 * t);
  const g = Math.floor(23 * (1 - t) + 95 * t);
  const b = Math.floor(42 * (1 - t) + 70 * t);
  for (let x = 0; x < width; x++) {
    const px = rowStart + 1 + x * 3;
    rawData[px] = r;
    rawData[px + 1] = g;
    rawData[px + 2] = b;
  }
}

const compressed = zlib.deflateSync(rawData);
const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const ihdr = makeChunk('IHDR', ihdrData);
const idat = makeChunk('IDAT', compressed);
const iend = makeChunk('IEND', Buffer.alloc(0));

const png = Buffer.concat([sig, ihdr, idat, iend]);
fs.writeFileSync('public/og-image.png', png);
console.log('Created public/og-image.png (1200x630), bytes:', png.length);

