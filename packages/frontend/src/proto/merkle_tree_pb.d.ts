// package: merkle_tree_proto
// file: merkle_tree.proto

import * as jspb from 'google-protobuf';

export class MerkleTreeNode extends jspb.Message {
  getNode(): Uint8Array | string;
  getNode_asU8(): Uint8Array;
  getNode_asB64(): string;
  setNode(value: Uint8Array | string): void;

  getIndex(): number;
  setIndex(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MerkleTreeNode.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MerkleTreeNode
  ): MerkleTreeNode.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MerkleTreeNode,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MerkleTreeNode;
  static deserializeBinaryFromReader(
    message: MerkleTreeNode,
    reader: jspb.BinaryReader
  ): MerkleTreeNode;
}

export namespace MerkleTreeNode {
  export type AsObject = {
    node: Uint8Array | string;
    index: number;
  };
}

export class MerkleTreeLayer extends jspb.Message {
  clearNodesList(): void;
  getNodesList(): Array<MerkleTreeNode>;
  setNodesList(value: Array<MerkleTreeNode>): void;
  addNodes(value?: MerkleTreeNode, index?: number): MerkleTreeNode;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MerkleTreeLayer.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MerkleTreeLayer
  ): MerkleTreeLayer.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MerkleTreeLayer,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MerkleTreeLayer;
  static deserializeBinaryFromReader(
    message: MerkleTreeLayer,
    reader: jspb.BinaryReader
  ): MerkleTreeLayer;
}

export namespace MerkleTreeLayer {
  export type AsObject = {
    nodesList: Array<MerkleTreeNode.AsObject>;
  };
}

export class MerkleTree extends jspb.Message {
  clearLayersList(): void;
  getLayersList(): Array<MerkleTreeLayer>;
  setLayersList(value: Array<MerkleTreeLayer>): void;
  addLayers(value?: MerkleTreeLayer, index?: number): MerkleTreeLayer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): MerkleTree.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: MerkleTree
  ): MerkleTree.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: MerkleTree,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): MerkleTree;
  static deserializeBinaryFromReader(
    message: MerkleTree,
    reader: jspb.BinaryReader
  ): MerkleTree;
}

export namespace MerkleTree {
  export type AsObject = {
    layersList: Array<MerkleTreeLayer.AsObject>;
  };
}
