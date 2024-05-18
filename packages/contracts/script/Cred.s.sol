// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import { Script, console } from 'forge-std/Script.sol';
import '../src/Cred.sol';

contract CredScript is Script {
  function setUp() public {}

  function run() public {
    uint256 deployerPrivateKey = vm.envUint('PRIVATE_KEY');
    vm.startBroadcast(deployerPrivateKey);

    Cred cred = new Cred();
    vm.stopBroadcast();
  }
}
