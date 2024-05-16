// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var group_data_pb = require('./group_data_pb.js');

function serialize_group_data_GroupDataRequest(arg) {
  if (!(arg instanceof group_data_pb.GroupDataRequest)) {
    throw new Error('Expected argument of type group_data.GroupDataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_group_data_GroupDataRequest(buffer_arg) {
  return group_data_pb.GroupDataRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_group_data_GroupDataResponse(arg) {
  if (!(arg instanceof group_data_pb.GroupDataResponse)) {
    throw new Error('Expected argument of type group_data.GroupDataResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_group_data_GroupDataResponse(buffer_arg) {
  return group_data_pb.GroupDataResponse.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

var GroupDataService = (exports.GroupDataService = {
  get: {
    path: '/group_data.GroupData/get',
    requestStream: false,
    responseStream: false,
    requestType: group_data_pb.GroupDataRequest,
    responseType: group_data_pb.GroupDataResponse,
    requestSerialize: serialize_group_data_GroupDataRequest,
    requestDeserialize: deserialize_group_data_GroupDataRequest,
    responseSerialize: serialize_group_data_GroupDataResponse,
    responseDeserialize: deserialize_group_data_GroupDataResponse,
  },
});

exports.GroupDataClient = grpc.makeGenericClientConstructor(GroupDataService);
