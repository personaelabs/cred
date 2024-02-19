import { GroupSelect } from '@/app/api/groups/route';
import { EligibleGroup } from '@/app/types';
import { AddressToGroupsMap, Groups } from '@/proto/address_to_groups_pb';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from 'viem';

const useEligibleGroups = (addresses: Hex[] | null) => {
  const [addressToGroupsMaps, setAddressToGroupsMaps] = useState<
    AddressToGroupsMap[] | null
  >(null);
  const [eligibleGroups, setEligibleGroups] = useState<EligibleGroup[] | null>(
    null
  );

  const [groups, setGroups] = useState<GroupSelect[] | null>(null);

  useEffect(() => {
    (async () => {
      const groupResponse = await fetch('/api/groups');

      if (!groupResponse.ok) {
        throw new Error('Group fetch failed');
      }

      const groupData = (await groupResponse.json()) as GroupSelect[];
      setGroups(groupData);
    })();
  }, []);

  const fetchMapping = useCallback(async () => {
    let skip = 0;
    const take = 100000;

    const _addressToGroupsMap = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const searchParams = new URLSearchParams();
      searchParams.set('skip', skip.toString());
      searchParams.set('take', take.toString());
      const response = await fetch(
        `/api/address-to-groups?${searchParams.toString()}`,
        {
          headers: {
            Accept: 'application/x-protobuf',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Address to groups fetch failed');
      }

      if (response.status === 204) {
        break;
      }

      const buffer = await response.arrayBuffer();
      const addressesToGroups = AddressToGroupsMap.deserializeBinary(
        new Uint8Array(buffer)
      );
      _addressToGroupsMap.push(addressesToGroups);
      skip += take;
    }

    setAddressToGroupsMaps(_addressToGroupsMap);
  }, []);

  const searchEligibleGroups = useCallback(async () => {
    // Mapping of eligible groups to the corresponding address of the group

    // Search for the eligible groups once the addresses and groups are available
    if (addresses && groups && addressToGroupsMaps) {
      const _eligibleGroups = [];
      const maps = addressToGroupsMaps.map(map => map.getAddresstogroupsMap());
      for (const address of addresses) {
        for (const map of maps) {
          const record = map.get(address);
          if (record) {
            const groupIds = (record as Groups).getGroupsList();
            for (const groupId of groupIds) {
              const group = groups.find(g => g.id === groupId);
              if (!group) {
                throw new Error('Group not found');
              }

              const groupWithAddress = {
                address,
                ...group,
              };

              _eligibleGroups.push(groupWithAddress);
            }
          }
        }
      }

      setEligibleGroups(_eligibleGroups);
    }
  }, [addressToGroupsMaps, addresses, groups]);

  // Fetch the address to groups mapping on page load
  useEffect(() => {
    fetchMapping();
  }, [fetchMapping]);

  useEffect(() => {
    searchEligibleGroups();
  }, [addresses, addressToGroupsMaps, searchEligibleGroups]);

  return eligibleGroups;
};

export default useEligibleGroups;
