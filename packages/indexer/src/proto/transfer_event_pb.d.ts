// package:
// file: transfer_event.proto

import * as jspb from 'google-protobuf';

export class ERC20TransferEvent extends jspb.Message {
  getFrom(): Uint8Array | string;
  getFrom_asU8(): Uint8Array;
  getFrom_asB64(): string;
  setFrom(value: Uint8Array | string): void;

  getTo(): Uint8Array | string;
  getTo_asU8(): Uint8Array;
  getTo_asB64(): string;
  setTo(value: Uint8Array | string): void;

  getValue(): Uint8Array | string;
  getValue_asU8(): Uint8Array;
  getValue_asB64(): string;
  setValue(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ERC20TransferEvent.AsObject;
  static toObject(
    includeInstance: boolean,
    msg: ERC20TransferEvent
  ): ERC20TransferEvent.AsObject;
  static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> };
  static extensionsBinary: {
    [key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>;
  };
  static serializeBinaryToWriter(
    message: ERC20TransferEvent,
    writer: jspb.BinaryWriter
  ): void;
  static deserializeBinary(bytes: Uint8Array): ERC20TransferEvent;
  static deserializeBinaryFromReader(
    message: ERC20TransferEvent,
    reader: jspb.BinaryReader
  ): ERC20TransferEvent;
}

export namespace ERC20TransferEvent {
  export type AsObject = {
    from: Uint8Array | string;
    to: Uint8Array | string;
    value: Uint8Array | string;
  };
}
