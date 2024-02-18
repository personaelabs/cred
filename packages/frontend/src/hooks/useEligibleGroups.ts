import { GroupSelect } from '@/app/api/groups/route';
import { EligibleGroup } from '@/app/types';
import { AddressToGroupsMap, Groups } from '@/proto/address_to_groups_pb';
import { useCallback, useEffect, useState } from 'react';
import { Hex } from 'viem';

const useEligibleGroups = (addresses: Hex[] | null) => {
  const [responses, setResponses] = useState<Response[]>([]);
  const [addressToGroupsMaps, setAddressToGroupsMaps] = useState<
    AddressToGroupsMap[]
  >([]);
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

      setResponses(prev => [...prev, response]);
      skip += take;
    }
  }, []);

  const searchEligibleGroups = useCallback(async () => {
    // Mapping of eligible groups to the corresponding address of the group

    const maps = addressToGroupsMaps.map(map => map.getAddresstogroupsMap());
    // Search for the eligible groups once the addresses and groups are available
    if (addresses && groups) {
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

              setEligibleGroups(prev =>
                prev
                  ? !prev.some(g => g.id === groupId)
                    ? [...prev, groupWithAddress]
                    : []
                  : [groupWithAddress]
              );
            }
          }
        }
      }
    }
  }, [addressToGroupsMaps, addresses, groups]);

  useEffect(() => {
    (async () => {
      // Parse the response and add it to the addressToGroupsMaps
      if (responses.length !== addressToGroupsMaps.length) {
        // Get the responses that haven't been parsed yet
        const responsesToParse = responses.slice(
          addressToGroupsMaps.length,
          responses.length
        );

        // Parse the responses
        for (const response of responsesToParse) {
          const buffer = await response.arrayBuffer();
          const addressesToGroups = AddressToGroupsMap.deserializeBinary(
            new Uint8Array(buffer)
          );
          setAddressToGroupsMaps(prev => [...prev, addressesToGroups]);
        }
      }
    })();
  }, [addressToGroupsMaps.length, responses]);

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
