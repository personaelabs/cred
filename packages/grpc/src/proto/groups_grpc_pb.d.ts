// GENERATED CODE -- DO NOT EDIT!

// package: groups
// file: groups.proto

import * as groups_pb from './groups_pb';
import * as grpc from '@grpc/grpc-js';

interface IGroupsService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  all: grpc.MethodDefinition<groups_pb.GroupsRequest, groups_pb.GroupsResponse>;
}

export const GroupsService: IGroupsService;

export interface IGroupsServer extends grpc.UntypedServiceImplementation {
  all: grpc.handleUnaryCall<groups_pb.GroupsRequest, groups_pb.GroupsResponse>;
}

export class GroupsClient extends grpc.Client {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: object
  );
  all(
    argument: groups_pb.GroupsRequest,
    callback: grpc.requestCallback<groups_pb.GroupsResponse>
  ): grpc.ClientUnaryCall;
  all(
    argument: groups_pb.GroupsRequest,
    metadataOrOptions: grpc.Metadata | grpc.CallOptions | null,
    callback: grpc.requestCallback<groups_pb.GroupsResponse>
  ): grpc.ClientUnaryCall;
  all(
    argument: groups_pb.GroupsRequest,
    metadata: grpc.Metadata | null,
    options: grpc.CallOptions | null,
    callback: grpc.requestCallback<groups_pb.GroupsResponse>
  ): grpc.ClientUnaryCall;
}
