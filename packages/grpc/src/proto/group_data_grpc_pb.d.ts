// GENERATED CODE -- DO NOT EDIT!

// package: group_data
// file: group_data.proto

import * as group_data_pb from './group_data_pb';
import * as grpc from '@grpc/grpc-js';

interface IGroupDataService
  extends grpc.ServiceDefinition<grpc.UntypedServiceImplementation> {
  get: grpc.MethodDefinition<
    group_data_pb.GroupDataRequest,
    group_data_pb.GroupDataResponse
  >;
}

export const GroupDataService: IGroupDataService;

export interface IGroupDataServer extends grpc.UntypedServiceImplementation {
  get: grpc.handleUnaryCall<
    group_data_pb.GroupDataRequest,
    group_data_pb.GroupDataResponse
  >;
}

export class GroupDataClient extends grpc.Client {
  constructor(
    address: string,
    credentials: grpc.ChannelCredentials,
    options?: object
  );
  get(
    argument: group_data_pb.GroupDataRequest,
    callback: grpc.requestCallback<group_data_pb.GroupDataResponse>
  ): grpc.ClientUnaryCall;
  get(
    argument: group_data_pb.GroupDataRequest,
    metadataOrOptions: grpc.Metadata | grpc.CallOptions | null,
    callback: grpc.requestCallback<group_data_pb.GroupDataResponse>
  ): grpc.ClientUnaryCall;
  get(
    argument: group_data_pb.GroupDataRequest,
    metadata: grpc.Metadata | null,
    options: grpc.CallOptions | null,
    callback: grpc.requestCallback<group_data_pb.GroupDataResponse>
  ): grpc.ClientUnaryCall;
}
