// SPIKE ONLY (throwaway): builds a minimal structurally-valid PMTiles v3
// archive with one empty tile, to prove Capacitor's Android server answers
// HTTP Range requests. NOT for release. Run: npm run spike:tiles
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { zxyToTileId } from 'pmtiles';

function varint(n) {
  const out = [];
  while (n >= 0x80) { out.push((n & 0x7f) | 0x80); n = Math.floor(n / 128); }
  out.push(n);
  return Buffer.from(out);
}

// One z14 tile over Tinghir center (31.5139, -5.5316). Payload is an empty
// tile on purpose: header/directory/metadata/tile reads are what we prove.
const Z = 14;
const n = 2 ** Z;
const x = Math.floor(((-5.5316 + 180) / 360) * n);
const latR = (31.5139 * Math.PI) / 180;
const y = Math.floor(((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * n);
const tileId = zxyToTileId(Z, x, y);
console.log(`tile z${Z}/${x}/${y} id=${tileId}`);

const tile = gzipSync(Buffer.alloc(0));
const metadata = gzipSync(Buffer.from(JSON.stringify({
  name: 'spike-tinghir',
  version: '1.0.0',
  vector_layers: [{ id: 'placeholder', fields: {}, minzoom: Z, maxzoom: Z }],
})));

// Root directory: 1 entry (tileId, runLength 1, length, offset 0 -> contiguous).
const dirRaw = Buffer.concat([
  varint(1), varint(tileId), varint(1), varint(tile.length), varint(1),
]);
const dir = gzipSync(dirRaw);

const header = Buffer.alloc(127);
header.write('PMTiles', 0, 'utf8');
header.writeUInt8(3, 7);
let o = 8;
const u64 = (v) => { header.writeBigUInt64LE(BigInt(v), o); o += 8; };
u64(127);                       // root offset
u64(dir.length);                // root length
u64(127 + dir.length);          // metadata offset
u64(metadata.length);           // metadata length
u64(0);                         // leaf offset (none)
u64(0);                         // leaf length
u64(127 + dir.length + metadata.length); // tile data offset
u64(tile.length);               // tile data length
u64(1); u64(1); u64(1);         // addressed, entries, contents
header.writeUInt8(1, 96);       // clustered
header.writeUInt8(2, 97);       // internal compression: gzip
header.writeUInt8(2, 98);       // tile compression: gzip
header.writeUInt8(1, 99);       // tile type: MVT
header.writeUInt8(Z, 100);      // minZ
header.writeUInt8(Z, 101);      // maxZ
o = 102;
const pos = (lng, lat) => {
  header.writeInt32LE(Math.round(lng * 1e7), o); o += 4;
  header.writeInt32LE(Math.round(lat * 1e7), o); o += 4;
};
pos(-5.6, 31.45); pos(-5.46, 31.58);   // min/max bounds
header.writeUInt8(Z, 118);             // center zoom
pos(-5.5316, 31.5139);                 // center

const archive = Buffer.concat([header, dir, metadata, tile]);
writeFileSync('public/spike-tiles/spike-tinghir.pmtiles', archive);
console.log(`wrote ${archive.length} bytes`);
