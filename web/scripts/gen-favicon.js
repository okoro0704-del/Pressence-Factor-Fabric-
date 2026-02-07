const fs = require('fs');
const path = require('path');
const w = 16, h = 16;
const bmpSize = 40 + w * h * 4;
const offset = 6 + 16;
const buf = Buffer.alloc(6 + 16 + bmpSize);
let o = 0;
buf.writeUInt16LE(0, o); o += 2;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt8(w, o); o += 1;
buf.writeUInt8(h, o); o += 1;
buf.writeUInt8(0, o); o += 1;
buf.writeUInt8(0, o); o += 1;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(32, o); o += 2;
buf.writeUInt32LE(bmpSize, o); o += 4;
buf.writeUInt32LE(offset, o); o += 4;
buf.writeUInt32LE(40, o); o += 4;
buf.writeInt32LE(w, o); o += 4;
buf.writeInt32LE(h * 2, o); o += 4;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(32, o); o += 2;
buf.writeUInt32LE(0, o); o += 4;
buf.writeUInt32LE(w * h * 4, o); o += 4;
// no color table for 32bpp
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  buf.writeUInt8(0x0d, o); o += 1;
  buf.writeUInt8(0x0d, o); o += 1;
  buf.writeUInt8(0x0f, o); o += 1;
  buf.writeUInt8(0xff, o); o += 1;
}
fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.ico'), buf);
console.log('Wrote public/favicon.ico');
