// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/Portal.sol';

contract PortalScript is Script {
  function setUp() public {}

  function run() public {
    vm.startBroadcast();

    Portal portal = new Portal();
    vm.stopBroadcast();
  }
}
