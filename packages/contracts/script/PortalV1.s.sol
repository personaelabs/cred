// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/PortalV1.sol';

contract PortalV1Script is Script {
  function setUp() public {}

  function run() public {
    vm.startBroadcast();

    PortalV1 portal = new PortalV1();
    vm.stopBroadcast();
  }
}
