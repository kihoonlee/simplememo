// Minimal Google Drive REST v3 client (fetch-based, serverless-friendly).
// Every function takes a user access token and is called only from server code.

const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveFile {
  id: string;
  name: string;
  modifiedTime?: string;
  mimeType?: string;
  md5Checksum?: string;
  trashed?: boolean;
}

export class DriveError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "DriveError";
    this.status = status;
  }
}

async function driveFetch(
  token: string,
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DriveError(res.status, `Drive ${res.status}: ${text.slice(0, 300)}`);
  }
  return res;
}

function q(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// List non-trashed .md files directly under a folder, newest first.
export async function listMarkdown(
  token: string,
  folderId: string,
): Promise<DriveFile[]> {
  const query = `'${q(folderId)}' in parents and trashed=false and mimeType!='${FOLDER_MIME}'`;
  const url =
    `${DRIVE}/files?q=${encodeURIComponent(query)}` +
    `&fields=${encodeURIComponent("files(id,name,modifiedTime)")}` +
    `&orderBy=modifiedTime desc&pageSize=1000`;
  const res = await driveFetch(token, url);
  const data: { files?: DriveFile[] } = await res.json();
  return (data.files ?? []).filter((f) => f.name.toLowerCase().endsWith(".md"));
}

export async function readFile(token: string, id: string): Promise<string> {
  const res = await driveFetch(token, `${DRIVE}/files/${id}?alt=media`);
  return res.text();
}

export async function getMeta(token: string, id: string): Promise<DriveFile> {
  const fields = encodeURIComponent("id,name,modifiedTime,md5Checksum,trashed");
  const res = await driveFetch(token, `${DRIVE}/files/${id}?fields=${fields}`);
  return res.json();
}

async function uploadMultipart(
  token: string,
  metadata: Record<string, unknown>,
  mediaType: string,
  data: string | ArrayBuffer,
): Promise<DriveFile> {
  const boundary = `smemo${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const pre =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mediaType}\r\n\r\n`;
  const post = `\r\n--${boundary}--`;
  const body = new Blob([pre, data, post]);
  const fields = encodeURIComponent("id,name,modifiedTime");
  const res = await driveFetch(
    token,
    `${UPLOAD}/files?uploadType=multipart&fields=${fields}`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return res.json();
}

export async function createTextFile(
  token: string,
  folderId: string,
  name: string,
  content: string,
): Promise<DriveFile> {
  return uploadMultipart(
    token,
    { name, parents: [folderId], mimeType: "text/markdown" },
    "text/markdown",
    content,
  );
}

export async function updateTextFile(
  token: string,
  id: string,
  content: string,
): Promise<DriveFile> {
  const fields = encodeURIComponent("id,name,modifiedTime");
  const res = await driveFetch(
    token,
    `${UPLOAD}/files/${id}?uploadType=media&fields=${fields}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "text/markdown" },
      body: content,
    },
  );
  return res.json();
}

export async function trashFile(token: string, id: string): Promise<void> {
  await driveFetch(token, `${DRIVE}/files/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true }),
  });
}

// Find or create a subfolder by name under a parent. Used for images/.
export async function ensureSubfolder(
  token: string,
  parentId: string,
  name: string,
): Promise<string> {
  const query =
    `'${q(parentId)}' in parents and name='${q(name)}' ` +
    `and mimeType='${FOLDER_MIME}' and trashed=false`;
  const url = `${DRIVE}/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent("files(id)")}`;
  const res = await driveFetch(token, url);
  const data: { files?: { id: string }[] } = await res.json();
  if (data.files && data.files.length > 0) return data.files[0].id;

  const created = await driveFetch(token, `${DRIVE}/files?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  const folder: { id: string } = await created.json();
  return folder.id;
}

// Create (or reuse) a dedicated app folder in the user's Drive root.
export async function createAppFolder(
  token: string,
  name: string,
): Promise<string> {
  return ensureSubfolder(token, "root", name);
}

async function shareAnyone(token: string, id: string): Promise<void> {
  await driveFetch(token, `${DRIVE}/files/${id}/permissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

// A link-shared image URL usable inside markdown (renders in external viewers).
export function imagePublicUrl(id: string): string {
  return `https://drive.google.com/uc?id=${id}`;
}

// Upload an image to the images/ subfolder, set link sharing, return id + URL.
export async function uploadImage(
  token: string,
  imagesFolderId: string,
  name: string,
  bytes: ArrayBuffer,
  mediaType: string,
): Promise<{ id: string; url: string }> {
  const file = await uploadMultipart(
    token,
    { name, parents: [imagesFolderId], mimeType: mediaType },
    mediaType,
    bytes,
  );
  await shareAnyone(token, file.id);
  return { id: file.id, url: imagePublicUrl(file.id) };
}
