// Image uploads land on the server's own disk and are referenced by public URL.
//
// The directory lives OUTSIDE the repo (see UPLOAD_DIR) on purpose: anything in
// public/ is part of the build and would be wiped by the next deploy, taking the
// client's photos with it.
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export const PUBLIC_PREFIX = '/uploads';
export const MAX_BYTES = 8 * 1024 * 1024;

const TYPES = {
  'image/jpeg': { ext: '.jpg', magic: [[0xff, 0xd8, 0xff]] },
  'image/png':  { ext: '.png', magic: [[0x89, 0x50, 0x4e, 0x47]] },
  'image/webp': { ext: '.webp', magic: [[0x52, 0x49, 0x46, 0x46]] }
};

const EXT_TYPES = { '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

export class UploadError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function uploadDir() {
  // Deliberately dynamic and outside the project tree, so opt out of the bundler's
  // filesystem tracing — otherwise it pulls the whole repo into the server output.
  return path.resolve(/* turbopackIgnore: true */ process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}

export async function save(file) {
  const kind = TYPES[file.type];
  if (!kind) throw new UploadError(`unsupported file type: ${file.type || 'unknown'}`, 415);
  if (file.size > MAX_BYTES) {
    throw new UploadError(`file is larger than ${Math.round(MAX_BYTES / 1024 / 1024)}MB`, 413);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Don't trust the declared Content-Type — check the actual bytes.
  if (!kind.magic.some(sig => sig.every((b, i) => buf[i] === b))) {
    throw new UploadError('file contents are not a valid image', 415);
  }

  // Content hash as the filename: identical uploads dedupe, collisions are not a
  // concern, and nothing client-supplied reaches the filesystem path.
  const name = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 24) + kind.ext;
  const dir = uploadDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);

  return `${PUBLIC_PREFIX}/${name}`;
}

/** Resolve a request path inside the upload dir, or null if it escapes. */
export function resolveInDir(parts) {
  const dir = uploadDir();
  const target = path.resolve(dir, ...parts);
  return target === dir || target.startsWith(dir + path.sep) ? target : null;
}

export function contentTypeFor(file) {
  return EXT_TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
