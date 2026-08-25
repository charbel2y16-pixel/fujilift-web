import fs from 'node:fs';

/**
 * Moves the MP4 `moov` atom in front of `mdat` (what ffmpeg calls faststart).
 *
 * The hero video is scrubbed against scroll position, so the browser has to be
 * able to seek immediately. With `moov` at the tail it cannot even read the
 * duration until it has fetched the end of the file. Shifting `moov` forward
 * moves `mdat` later, so every chunk offset in stco/co64 is rebased by the
 * size of the atom we moved.
 *
 *   node scripts/faststart.mjs <in.mp4> [out.mp4]
 */

const inPath = process.argv[2];
const outPath = process.argv[3] ?? inPath;
const buf = fs.readFileSync(inPath);

/** Walks the boxes at one level. */
function* boxes(start, end) {
  let i = start;
  while (i + 8 <= end) {
    let size = buf.readUInt32BE(i);
    const type = buf.toString('latin1', i + 4, i + 8);
    let header = 8;
    if (size === 1) {
      size = Number(buf.readBigUInt64BE(i + 8));
      header = 16;
    } else if (size === 0) {
      size = end - i;
    }
    if (size < header) return;
    yield { type, start: i, body: i + header, end: i + size, size };
    i += size;
  }
}

const top = [...boxes(0, buf.length)];
const moov = top.find((b) => b.type === 'moov');
const mdat = top.find((b) => b.type === 'mdat');

if (!moov || !mdat) {
  console.error('no moov/mdat — not an MP4?');
  process.exit(1);
}
if (moov.start < mdat.start) {
  console.log('already faststart, nothing to do');
  process.exit(0);
}

// Work on a copy of moov so we can rebase its offsets.
const moovBuf = Buffer.from(buf.subarray(moov.start, moov.end));
const delta = moov.size;

const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'edts', 'udta']);
let patched = 0;

/** Recurses into the copied moov and rebases every chunk offset. */
function rebase(start, end) {
  let i = start;
  while (i + 8 <= end) {
    let size = moovBuf.readUInt32BE(i);
    const type = moovBuf.toString('latin1', i + 4, i + 8);
    let header = 8;
    if (size === 1) {
      size = Number(moovBuf.readBigUInt64BE(i + 8));
      header = 16;
    } else if (size === 0) {
      size = end - i;
    }
    if (size < header) return;
    const body = i + header;

    if (CONTAINERS.has(type)) {
      rebase(body, i + size);
    } else if (type === 'stco') {
      const n = moovBuf.readUInt32BE(body + 4);
      for (let k = 0; k < n; k++) {
        const at = body + 8 + k * 4;
        moovBuf.writeUInt32BE(moovBuf.readUInt32BE(at) + delta, at);
      }
      patched += n;
    } else if (type === 'co64') {
      const n = moovBuf.readUInt32BE(body + 4);
      for (let k = 0; k < n; k++) {
        const at = body + 8 + k * 8;
        moovBuf.writeBigUInt64BE(moovBuf.readBigUInt64BE(at) + BigInt(delta), at);
      }
      patched += n;
    }
    i += size;
  }
}

// moovBuf is the atom on its own, so its body starts at the header length.
rebase(moov.body - moov.start, moovBuf.length);

const before = buf.subarray(0, mdat.start);            // ftyp, uuid, …
const media = buf.subarray(mdat.start, moov.start);    // mdat
const after = buf.subarray(moov.end);                  // anything trailing

fs.writeFileSync(outPath, Buffer.concat([before, moovBuf, media, after]));

console.log(
  `moved moov (${moov.size} bytes) ahead of mdat, rebased ${patched} chunk offsets\n` +
  `${inPath} -> ${outPath}  ${fs.statSync(outPath).size} bytes`,
);
