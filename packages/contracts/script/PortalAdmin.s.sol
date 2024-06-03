// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/Portal.sol';

contract SetupUnitPrice is Script {
    Portal portal = Portal(0xb8B0c71AA4e96F002BCd4dE6582B61c80e373E24);

  function setUp() public {}

  function setUnitPrice() public {
    uint256 unitPriceBefore = portal.unitPrice();

    vm.startBroadcast();
    portal.setUnitPrice(0.0001 ether);
    vm.stopBroadcast();

    uint256 unitPriceAfter = portal.unitPrice();

    console.log('Unit price before:', unitPriceBefore);
    console.log('Unit price after:', unitPriceAfter);
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
    portal.setFeeRecipient(0x1234567890123456789012345678901234567890);
    vm.stopBroadcast();

    address feeRecipientAfter = portal.feeRecipient();

    console.log('Fee recipient before:', feeRecipientBefore);
    console.log('Fee recipient after:', feeRecipientAfter);
  }
}
