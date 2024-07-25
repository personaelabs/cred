pragma solidity ^0.8.13;
import 'forge-std/Test.sol';
import '../src/PortalV1.sol';
import 'forge-std/console.sol';
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { IERC1155Receiver } from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract PortalV1Test is Test {
  PortalV1 portal;

  function setUp() public {
    address owner = address(this);
    portal = new PortalV1(owner);
  }

  /**
   ********* Utility functions *********
   */

  function buyKey(address to, uint256 keyId) public payable {
    uint256 price = portal.keyIdToPrice(keyId);

    portal.buyKey{ value: price }(to, keyId);
  }

  receive() external payable {}

  /**
   ********* Tests *********
   */

  function testFuzz_setPaymentRecipient(address recipient) public {
    portal.setPaymentRecipient(recipient);
    assertEq(portal.paymentRecipient(), recipient);

    vm.prank(address(makeAddr('alice')));
    vm.expectRevert();
    portal.setPaymentRecipient(recipient);
  }

  function testFuzz_setPrice(uint256 keyId, uint256 price) public {
    portal.setPrice(keyId, price);
    assertEq(portal.keyIdToPrice(keyId), price);

    vm.prank(address(makeAddr('alice')));
    vm.expectRevert();
    portal.setPrice(keyId, price);
  }

  function test_buyKey() public {
    uint256 keyId = 1;

    uint256 price = 0.001 ether;
    portal.setPrice(keyId, price);

    buyKey(address(this), keyId);

    // The address should now own the key
    assertEq(portal.addressToKeys(address(this), keyId), true);

    // Shouldn't be able to buy the same key again
    vm.expectRevert('Key already owned');
    portal.buyKey{ value: price }(address(this), keyId);

    // Shouldn't be able to buy a key that doesn't exist
    vm.expectRevert('Key not found');
    portal.buyKey{ value: price }(address(this), 2);
  }

  function test_PaymentCollection() public {
    uint256 keyId = 1;
    uint256 price = 0.001 ether;

    portal.setPrice(keyId, price);

    address recipient = vm.addr(333);
    portal.setPaymentRecipient(recipient);
    buyKey(address(this), keyId);

    assertEq(address(portal.paymentRecipient()).balance, price);
  }

  function test_WhenPaused() public {
    portal.pause();
    uint256 keyId = 1;

    vm.expectRevert('Contract is paused');
    portal.buyKey(address(this), keyId);
  }
}
