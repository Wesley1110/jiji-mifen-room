export async function loadFiberData() {
  const response = await fetch('./assets/fibers.json');
  if (!response.ok) throw Error('Missing fiber metadata');
  const meta = await response.json();
  const names = meta.binaryParts ?? ['fibers.bin'];
  const buffers = await Promise.all(names.map(async name => {
    const part = await fetch(`./assets/${name}`);
    if (!part.ok) throw Error(`Missing fiber data: ${name}`);
    return part.arrayBuffer();
  }));
  const bytes = buffers.reduce((total, buffer) => total + buffer.byteLength, 0);
  if (bytes !== meta.fiberCount * meta.strideFloats * 4) throw Error('Incomplete fiber data');
  const joined = new Uint8Array(bytes);
  let offset = 0;
  for (const buffer of buffers) {
    joined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return [meta, joined.buffer];
}
