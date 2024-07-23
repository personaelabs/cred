pragma solidity ^0.8.13;
import 'forge-std/Test.sol';
import '../src/PortalV1.sol';
import 'forge-std/console.sol';
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { IERC1155Receiver } from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract PortalV1Test is Test, IERC1155Receiver {
  PortalV1 portal;

  function onERC1155Received(
    address operator,
    address from,
    uint256 id,
    uint256 value,
    bytes calldata data
  ) external returns (bytes4) {
    return this.onERC1155Received.selector;
  }

  function onERC1155BatchReceived(
    address operator,
    address from,
    uint256[] calldata ids,
    uint256[] calldata values,
    bytes calldata data
  ) external returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
  }

  function supportsInterface(bytes4 interfaceID) external view returns (bool) {
    return
      interfaceID == 0x01ffc9a7 || // ERC-165 support (i.e. `bytes4(keccak256('supportsInterface(bytes4)'))`).
      interfaceID == 0x4e2312e0; // ERC-1155 `ERC1155TokenReceiver` support (i.e. `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)")) ^ bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`).
  }

  function setUp() public {
    portal = new PortalV1();
  }

  /**
   ********* Utility functions *********
   */

  function buyKey(address to, uint256 tokenId) public payable {
    uint256 price = portal.price();
    uint256 fee = portal.getProtocolFee(price);

    portal.buyKey{ value: price + fee }(to, tokenId, '');
  }

  receive() external payable {}

  /**
   ********* Tests *********
   */

  function testFuzz_setFeePercentage(uint8 percentage) public {
    portal.setFeePercentage(percentage % 100);
    assertEq(portal.feePercentage(), percentage % 100);

    vm.prank(address(makeAddr('alice')));
    vm.expectRevert();
    portal.setFeePercentage(percentage % 100);
  }

  function testFuzz_setFeeRecipient(address recipient) public {
    portal.setFeeRecipient(recipient);
    assertEq(portal.feeRecipient(), recipient);

    vm.prank(address(makeAddr('alice')));
    vm.expectRevert();
    portal.setFeeRecipient(recipient);
  }

  function testFuzz_setPrice(uint256 price) public {
    portal.setPrice(price);
    assertEq(portal.price(), price);

    vm.prank(address(makeAddr('alice')));
    vm.expectRevert();
    portal.setPrice(price);
  }

  function test_ProtocolFeeCollection() public {
    address recipient = vm.addr(333);
    portal.setFeeRecipient(recipient);

    uint256 tokenId = 1;
    buyKey(address(this), tokenId);

    portal.sellKey(tokenId);

    uint256 feePercentage = portal.feePercentage();
    uint256 price = portal.price();

    uint256 expectedFeeOnBuy = (price * feePercentage) / 100;
    uint256 expectedFeeOnSell = (price * feePercentage) / 100;

    uint256 expectedFee = expectedFeeOnBuy + expectedFeeOnSell;
    assertEq(address(recipient).balance, expectedFee);
  }

  function test_BalanceAfterBuy() public {
    uint256 tokenId = 1;
    buyKey(address(this), tokenId);
    assertEq(portal.balanceOf(address(this), tokenId), 1);
  }

  function test_BalanceAfterSell() public {
    uint256 tokenId = 1;
    buyKey(address(this), tokenId);

    portal.sellKey(tokenId);

    assertEq(portal.balanceOf(address(this), tokenId), 0);
  }

  function test_WhenPaused() public {
    portal.pause();
    uint256 tokenId = 1;

    vm.expectRevert('Contract is paused');
    portal.buyKey(address(this), tokenId, '');

    vm.expectRevert('Contract is paused');
    portal.sellKey(tokenId);
  }
}
