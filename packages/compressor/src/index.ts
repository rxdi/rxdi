import msgpack from 'msgpack5';
import nodeLzw from 'node-lzw';
import safe64 from 'urlsafe-base64';

export function compress(json: Record<string, unknown>) {
 const packed = msgpack().encode(json);
 const compressed = Buffer.from(nodeLzw.encode(packed.toString('binary')));
 const encoded = safe64.encode(compressed);
 return encoded;
}

export function decompress(string: string) {
 const decoded = safe64.decode(string);
 const decompressed = Buffer.from(nodeLzw.decode(decoded), 'binary');
 const unpacked = msgpack().decode(decompressed);
 return unpacked;
}
