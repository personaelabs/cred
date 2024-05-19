// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/Cred.sol';

contract CredScript is Script {
  function setUp() public {}

  function run() public {
    vm.startBroadcast();

    Cred cred = new Cred();
    vm.stopBroadcast();
  }
}
