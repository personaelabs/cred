// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var groups_pb = require('./groups_pb.js');

function serialize_groups_GroupsRequest(arg) {
  if (!(arg instanceof groups_pb.GroupsRequest)) {
    throw new Error('Expected argument of type groups.GroupsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_groups_GroupsRequest(buffer_arg) {
  return groups_pb.GroupsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_groups_GroupsResponse(arg) {
  if (!(arg instanceof groups_pb.GroupsResponse)) {
    throw new Error('Expected argument of type groups.GroupsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_groups_GroupsResponse(buffer_arg) {
  return groups_pb.GroupsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

var GroupsService = (exports.GroupsService = {
  all: {
    path: '/groups.Groups/all',
    requestStream: false,
    responseStream: false,
    requestType: groups_pb.GroupsRequest,
    responseType: groups_pb.GroupsResponse,
    requestSerialize: serialize_groups_GroupsRequest,
    requestDeserialize: deserialize_groups_GroupsRequest,
    responseSerialize: serialize_groups_GroupsResponse,
    responseDeserialize: deserialize_groups_GroupsResponse,
  },
});

exports.GroupsClient = grpc.makeGenericClientConstructor(GroupsService);
