// package:
// file: address_to_groups.proto

import * as jspb from 'google-protobuf';

export class Groups extends jspb.Message {
  clearGroupsList(): void;
  getGroupsList(): Array<number>;
  setGroupsList(value: Array<number>): void;
  addGroups(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Groups.AsObject;
  static toObject(includeInstance: boolean, msg: Groups): Groups.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Groups,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Groups;
  static deserializeBinaryFromReader(
    message: Groups,
    reader: jspb.BinaryReader
  ): Groups;
}

export namespace Groups {
  export type AsObject = {
    groupsList: Array<number>;
  };
}

export class AddressToGroupsMap extends jspb.Message {
  getAddresstogroupsMap(): jspb.Map<string, Groups>;
  clearAddresstogroupsMap(): void;
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AddressToGroupsMap.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: AddressToGroupsMap
  ): AddressToGroupsMap.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: AddressToGroupsMap,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): AddressToGroupsMap;
  static deserializeBinaryFromReader(
    message: AddressToGroupsMap,
    reader: jspb.BinaryReader
  ): AddressToGroupsMap;
}

export namespace AddressToGroupsMap {
  export type AsObject = {
    addresstogroupsMap: Array<[string, Groups.AsObject]>;
  };
}
