import * as grpc from '@grpc/grpc-js';
import { GroupDataClient } from './proto/group_data_grpc_pb';
import { CREDDD_GRPC_URL } from './utils';
import { GroupDataRequest, GroupDataResponse } from './proto/group_data_pb';

const groupDataClient = new GroupDataClient(
  CREDDD_GRPC_URL,
  grpc.credentials.createInsecure()
);

const getGroupData = (groupId: string): Promise<GroupDataResponse.AsObject> => {
  return new Promise((resolve, reject) => {
    const req = new GroupDataRequest();
    req.setId(groupId);

    groupDataClient.get(req, (err, res) => {
      if (err) {
        reject(err);
      } else {
        const group = res!.toObject();
        resolve(group);
      }
    });
  });
};

export default getGroupData;
