import * as msgpack from "msgpack5";
import * as nodeLzw from "node-lzw";
import * as safe64 from "urlsafe-base64";

export class LZWService {
  static compress<T>(object: T): string {
    const packed = msgpack().encode(object);
    const compressed = Buffer.from(nodeLzw.encode(packed.toString("binary")));
    const encoded = safe64.encode(compressed);
    return encoded;
  }

  static decompress<T>(string: string): T {
    const decoded = safe64.decode(string);
    const decompressed = Buffer.from(nodeLzw.decode(decoded), "binary");
    const unpacked = msgpack().decode(decompressed);
    return unpacked;
  }
}
