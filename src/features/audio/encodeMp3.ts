const BITRATE_KBPS = 128;
const SAMPLE_BLOCK = 1152;

const toInt16 = (channel: Float32Array): Int16Array => {
  const out = new Int16Array(channel.length);
  for (let i = 0; i < channel.length; i += 1) {
    const s = Math.max(-1, Math.min(1, channel[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

export const encodeMp3 = async (blob: Blob): Promise<Blob> => {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
  await audioContext.close();

  const channels = Math.min(audioBuffer.numberOfChannels, 2);
  const sampleRate = audioBuffer.sampleRate;
  const encoder = new Mp3Encoder(channels, sampleRate, BITRATE_KBPS);

  const left = toInt16(audioBuffer.getChannelData(0));
  const right = channels > 1 ? toInt16(audioBuffer.getChannelData(1)) : null;

  const chunks: Uint8Array[] = [];
  for (let i = 0; i < left.length; i += SAMPLE_BLOCK) {
    const l = left.subarray(i, i + SAMPLE_BLOCK);
    const r = right?.subarray(i, i + SAMPLE_BLOCK);
    const encoded = r ? encoder.encodeBuffer(l, r) : encoder.encodeBuffer(l);
    if (encoded.length > 0) chunks.push(encoded);
  }
  const tail = encoder.flush();
  if (tail.length > 0) chunks.push(tail);

  return new Blob(chunks as BlobPart[], { type: "audio/mpeg" });
};
