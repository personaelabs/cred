import * as grpc from '@grpc/grpc-js';
import { GroupsClient } from './proto/groups_grpc_pb';
import { GroupsRequest, GroupsResponse } from './proto/groups_pb';
import { CREDDD_GRPC_URL } from './utils';

const groupsClient = new GroupsClient(
  CREDDD_GRPC_URL,
  grpc.credentials.createInsecure()
);

const getGroups = (): Promise<GroupsResponse.AsObject> => {
  return new Promise((resolve, reject) => {
    const req = new GroupsRequest();

    groupsClient.all(req, (err, res) => {
      if (err) {
        reject(err);
      } else {
        const groups = res!.toObject();
        resolve(groups);
      }
    });
  });
};

export default getGroups;
