export class BodyTooLarge extends Error {}
/** Bound bytes even when Content-Length is absent or dishonest. */
export async function limitedText(request: Request, maximum: number) {
  if (Number(request.headers.get('content-length')) > maximum) throw new BodyTooLarge();
  const reader = request.body?.getReader();
  if (!reader) return '';
  let text = '', size = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new BodyTooLarge(); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}
