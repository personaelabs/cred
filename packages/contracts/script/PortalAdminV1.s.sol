// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/PortalV1.sol';

contract PortalAdminV1 is Script {
  PortalV1 portal = PortalV1(0x4c62e19A56dd3F31350cEDB605D234fef7D12d18);

  function setUp() public {}

  function transferOwnership() public {
    address ownerBefore = portal.owner();

    vm.startBroadcast();
    portal.transferOwnership(0x46dFcA07Df4e82b5cCCd4944FB728a926890a2f8);
    vm.stopBroadcast();

    address ownerAfter = portal.owner();

    console.log('Owner before:', ownerBefore);
    console.log('Owner after:', ownerAfter);
  }

  function setPrice() public {
    uint256 priceBefore = portal.price();

    vm.startBroadcast();
    portal.setPrice(0.0001 ether);
    vm.stopBroadcast();

    uint256 priceAfter = portal.price();

    console.log('price before:', priceBefore);
    console.log('price after:', priceAfter);
  }

  function setFeePercentage() public {
    uint256 feePercentageBefore = portal.feePercentage();

    vm.startBroadcast();
    portal.setFeePercentage(1);
    vm.stopBroadcast();

    uint256 feePercentageAfter = portal.feePercentage();

    console.log('Fee percentage before:', feePercentageBefore);
    console.log('Fee percentage after:', feePercentageAfter);
  }

  function setFeeRecipient() public {
    address feeRecipientBefore = portal.feeRecipient();

    vm.startBroadcast();
    portal.setFeeRecipient(0x46dFcA07Df4e82b5cCCd4944FB728a926890a2f8);
    vm.stopBroadcast();

    address feeRecipientAfter = portal.feeRecipient();

    console.log('Fee recipient before:', feeRecipientBefore);
    console.log('Fee recipient after:', feeRecipientAfter);
  }
}
