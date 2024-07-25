// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/PortalV1.sol';

contract PortalAdminV1 is Script {
  PortalV1 portal = PortalV1(0xb914DAcf01182fB7cee84739d2fCCe39016Fdc3c);

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
    uint256 keyId = 2;
    uint256 priceBefore = portal.keyIdToPrice(keyId);

    address owner = portal.owner();
    console.log('Owner:', owner);

    vm.startBroadcast();
    portal.setPrice(keyId, 0.0001 ether);
    vm.stopBroadcast();

    uint256 priceAfter = portal.keyIdToPrice(keyId);

    console.log('price before:', priceBefore);
    console.log('price after:', priceAfter);
  }

  function setPaymentRecipient() public {
    address paymentRecipientBefore = portal.paymentRecipient();

    vm.startBroadcast();
    portal.setPaymentRecipient(0x46dFcA07Df4e82b5cCCd4944FB728a926890a2f8);
    vm.stopBroadcast();

    address paymentRecipientAfter = portal.paymentRecipient();

    console.log('Payment recipient before:', paymentRecipientBefore);
    console.log('Payment recipient after:', paymentRecipientAfter);
  }
}
