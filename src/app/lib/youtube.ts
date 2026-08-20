/** Accepts watch, youtu.be, embed and shorts URLs; returns null if none match. */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube(?:-nocookie)?\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function thumbnailFor(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}
