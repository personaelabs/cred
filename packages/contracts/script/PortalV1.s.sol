// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/PortalV1.sol';

contract PortalV1Script is Script {
  function setUp() public {}

  function run() public {
    vm.startBroadcast();

    address owner = 0xbE6beda42FC2f31444385E92371a2ACF1ACBE8D6;
    PortalV1 portal = new PortalV1{ salt: 0 }(owner);
    vm.stopBroadcast();

    console.log('PortalV1 deployed at:', address(portal));
  }
}
