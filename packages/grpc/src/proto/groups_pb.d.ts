// package: groups
// file: groups.proto

import * as jspb from 'google-protobuf';

export class GroupsRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupsRequest.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GroupsRequest
  ): GroupsRequest.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GroupsRequest,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GroupsRequest;
  static deserializeBinaryFromReader(
    message: GroupsRequest,
    reader: jspb.BinaryReader
  ): GroupsRequest;
}

export namespace GroupsRequest {
  export type AsObject = {};
}

export class Group extends jspb.Message {
  getId(): string;
  setId(value: string): void;

  getDisplayname(): string;
  setDisplayname(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Group.AsObject;
  static toObject(includeInstance: boolean, msg: Group): Group.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: Group,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): Group;
  static deserializeBinaryFromReader(
    message: Group,
    reader: jspb.BinaryReader
  ): Group;
}

export namespace Group {
  export type AsObject = {
    id: string;
    displayname: string;
  };
}

export class GroupsResponse extends jspb.Message {
  clearGroupsList(): void;
  getGroupsList(): Array<Group>;
  setGroupsList(value: Array<Group>): void;
  addGroups(value?: Group, index?: number): Group;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): GroupsResponse.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: GroupsResponse
  ): GroupsResponse.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: GroupsResponse,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): GroupsResponse;
  static deserializeBinaryFromReader(
    message: GroupsResponse,
    reader: jspb.BinaryReader
  ): GroupsResponse;
}

export namespace GroupsResponse {
  export type AsObject = {
    groupsList: Array<Group.AsObject>;
  };
}
