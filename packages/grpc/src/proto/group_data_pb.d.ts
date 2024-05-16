// package: group_data
// file: group_data.proto

import * as jspb from 'google-protobuf';

export class GroupDataRequest extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupDataRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GroupDataRequest
  ): GroupDataRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GroupDataRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GroupDataRequest;
  static deserializeBinaryFromReader(
    message: GroupDataRequest,
    reader: jspb.BinaryReader
  ): GroupDataRequest;
}

export namespace GroupDataRequest {
  export type AsObject = {
    id: string;
  };
}

export class GroupDataResponse extends jspb.Message {
  getDisplayName(): string;
  setDisplayName(value: string): void;

  getLatestMerkleTree(): Uint8Array | string;
  getLatestMerkleTree_asU8(): Uint8Array;
  getLatestMerkleTree_asB64(): string;
  setLatestMerkleTree(value: Uint8Array | string): void;

  getBloomFilter(): Uint8Array | string;
  getBloomFilter_asU8(): Uint8Array;
  getBloomFilter_asB64(): string;
  setBloomFilter(value: Uint8Array | string): void;

  clearBloomSipKeysList(): void;
  getBloomSipKeysList(): Array<Uint8Array | string>;
  getBloomSipKeysList_asU8(): Array<Uint8Array>;
  getBloomSipKeysList_asB64(): Array<string>;
  setBloomSipKeysList(value: Array<Uint8Array | string>): void;
  addBloomSipKeys(
    value: Uint8Array | string,
    index?: number
  ): Uint8Array | string;

  getBloomNumBits(): number;
  setBloomNumBits(value: number): void;

  getBloomNumHashes(): number;
  setBloomNumHashes(value: number): void;

  getBlockNumber(): number;
  setBlockNumber(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupDataResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GroupDataResponse
  ): GroupDataResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GroupDataResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GroupDataResponse;
  static deserializeBinaryFromReader(
    message: GroupDataResponse,
    reader: jspb.BinaryReader
  ): GroupDataResponse;
}

export namespace GroupDataResponse {
  export type AsObject = {
    displayName: string;
    latestMerkleTree: Uint8Array | string;
    bloomFilter: Uint8Array | string;
    bloomSipKeysList: Array<Uint8Array | string>;
    bloomNumBits: number;
    bloomNumHashes: number;
    blockNumber: number;
  };
}
