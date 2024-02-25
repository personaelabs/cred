// package: merkle_proof
// file: merkle_proof.proto

import * as jspb from 'google-protobuf';

export class MerkleProof extends jspb.Message {
  getAddress(): Uint8Array | string;
  getAddress_asU8(): Uint8Array;
  getAddress_asB64(): string;
  setAddress(value: Uint8Array | string): void;

  clearSiblingsList(): void;
  getSiblingsList(): Array<Uint8Array | string>;
  getSiblingsList_asU8(): Array<Uint8Array>;
  getSiblingsList_asB64(): Array<string>;
  setSiblingsList(value: Array<Uint8Array | string>): void;
  addSiblings(value: Uint8Array | string, index?: number): Uint8Array | string;

  clearIndicesList(): void;
  getIndicesList(): Array<boolean>;
  setIndicesList(value: Array<boolean>): void;
  addIndices(value: boolean, index?: number): boolean;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MerkleProof.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MerkleProof
  ): MerkleProof.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MerkleProof,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MerkleProof;
  static deserializeBinaryFromReader(
    message: MerkleProof,
    reader: jspb.BinaryReader
  ): MerkleProof;
}

export namespace MerkleProof {
  export type AsObject = {
    address: Uint8Array | string;
    siblingsList: Array<Uint8Array | string>;
    indicesList: Array<boolean>;
  };
}
