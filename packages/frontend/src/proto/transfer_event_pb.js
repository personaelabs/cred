// source: transfer_event.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = function () {
  return this || window || global || self || Function('return this')();
}.call(null);

goog.exportSymbol('proto.ERC20TransferEvent', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.ERC20TransferEvent = function (opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.ERC20TransferEvent, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.ERC20TransferEvent.displayName = 'proto.ERC20TransferEvent';
}

if (jspb.Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.ERC20TransferEvent.prototype.toObject = function (opt_includeInstance) {
    return proto.ERC20TransferEvent.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.ERC20TransferEvent} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.ERC20TransferEvent.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        from: msg.getFrom_asB64(),
        to: msg.getTo_asB64(),
        value: msg.getValue_asB64(),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.ERC20TransferEvent}
 */
proto.ERC20TransferEvent.deserializeBinary = function (bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.ERC20TransferEvent();
  return proto.ERC20TransferEvent.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.ERC20TransferEvent} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.ERC20TransferEvent}
 */
proto.ERC20TransferEvent.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setFrom(value);
        break;
      case 2:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setTo(value);
        break;
      case 3:
        var value = /** @type {!Uint8Array} */ (reader.readBytes());
        msg.setValue(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.ERC20TransferEvent.prototype.serializeBinary = function () {
  var writer = new jspb.BinaryWriter();
  proto.ERC20TransferEvent.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.ERC20TransferEvent} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.ERC20TransferEvent.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getFrom_asU8();
  if (f.length > 0) {
    writer.writeBytes(1, f);
  }
  f = message.getTo_asU8();
  if (f.length > 0) {
    writer.writeBytes(2, f);
  }
  f = message.getValue_asU8();
  if (f.length > 0) {
    writer.writeBytes(3, f);
  }
};

/**
 * optional bytes from = 1;
 * @return {!(string|Uint8Array)}
 */
proto.ERC20TransferEvent.prototype.getFrom = function () {
  return /** @type {!(string|Uint8Array)} */ (
    jspb.Message.getFieldWithDefault(this, 1, '')
  );
};

/**
 * optional bytes from = 1;
 * This is a type-conversion wrapper around `getFrom()`
 * @return {string}
 */
proto.ERC20TransferEvent.prototype.getFrom_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getFrom()));
};

/**
 * optional bytes from = 1;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getFrom()`
 * @return {!Uint8Array}
 */
proto.ERC20TransferEvent.prototype.getFrom_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getFrom()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.ERC20TransferEvent} returns this
 */
proto.ERC20TransferEvent.prototype.setFrom = function (value) {
  return jspb.Message.setProto3BytesField(this, 1, value);
};

/**
 * optional bytes to = 2;
 * @return {!(string|Uint8Array)}
 */
proto.ERC20TransferEvent.prototype.getTo = function () {
  return /** @type {!(string|Uint8Array)} */ (
    jspb.Message.getFieldWithDefault(this, 2, '')
  );
};

/**
 * optional bytes to = 2;
 * This is a type-conversion wrapper around `getTo()`
 * @return {string}
 */
proto.ERC20TransferEvent.prototype.getTo_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getTo()));
};

/**
 * optional bytes to = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getTo()`
 * @return {!Uint8Array}
 */
proto.ERC20TransferEvent.prototype.getTo_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getTo()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.ERC20TransferEvent} returns this
 */
proto.ERC20TransferEvent.prototype.setTo = function (value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};

/**
 * optional bytes value = 3;
 * @return {!(string|Uint8Array)}
 */
proto.ERC20TransferEvent.prototype.getValue = function () {
  return /** @type {!(string|Uint8Array)} */ (
    jspb.Message.getFieldWithDefault(this, 3, '')
  );
};

/**
 * optional bytes value = 3;
 * This is a type-conversion wrapper around `getValue()`
 * @return {string}
 */
proto.ERC20TransferEvent.prototype.getValue_asB64 = function () {
  return /** @type {string} */ (jspb.Message.bytesAsB64(this.getValue()));
};

/**
 * optional bytes value = 3;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getValue()`
 * @return {!Uint8Array}
 */
proto.ERC20TransferEvent.prototype.getValue_asU8 = function () {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(this.getValue()));
};

/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.ERC20TransferEvent} returns this
 */
proto.ERC20TransferEvent.prototype.setValue = function (value) {
  return jspb.Message.setProto3BytesField(this, 3, value);
};

goog.object.extend(exports, proto);