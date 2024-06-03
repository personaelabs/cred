pragma solidity ^0.8.13;
import 'forge-std/Test.sol';
import '../src/Portal.sol';
import 'forge-std/console.sol';
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { IERC1155Receiver } from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract ContractBTest is Test, IERC1155Receiver {
  Portal portal;

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
    portal = new Portal();
  }

  /**
   ********* Utility functions *********
   */

  function buyKeys(address to, uint256 tokenId, uint256 amount) public payable {
    uint256 buyPrice = portal.getBuyPrice(tokenId, amount);
    uint256 fee = portal.getProtocolFee(buyPrice);

    portal.buyKeys{ value: buyPrice + fee }(to, tokenId, amount, '');
  }

  function getTetrahedralNumber(uint256 n) public pure returns (uint256) {
    return (n * (n + 1) * (n + 2)) / 6;
  }

  function getTriangularNumber(uint256 n) public pure returns (uint256) {
    return (n * (n + 1)) / 2;
  }

  /**
   * @dev Adjust the amount to be greater than 0
   */
  function adjustAmount(uint8 amount) public pure returns (uint256) {
    return uint256(amount) + 1;
  }

  receive() external payable {}

  /**
   ********* Tests *********
   */

  function testFuzz_setFeePercentage(uint8 percentage) public {
    portal.setFeePercentage(percentage % 100);
    assertEq(portal.feePercentage(), percentage % 100);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    portal.setFeePercentage(percentage % 100);
  }

  function testFuzz_setFeeRecipient(address recipient) public {
    portal.setFeeRecipient(recipient);
    assertEq(portal.feeRecipient(), recipient);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    portal.setFeeRecipient(recipient);
  }

  function testFuzz_setUnitPrice(uint256 price) public {
    portal.setUnitPrice(price);
    assertEq(portal.unitPrice(), price);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    portal.setUnitPrice(price);
  }

  function test_ProtocolFeeCollection() public {
    address recipient = vm.addr(333);
    portal.setFeeRecipient(recipient);

    uint8 amount = 10;
    uint256 tokenId = 1;
    buyKeys(address(this), tokenId, amount);

    portal.sellKeys(tokenId, amount);

    uint256 feePercentage = portal.feePercentage();
    uint256 unitPrice = portal.unitPrice();

    uint256 expectedFeeOnBuy = (getTetrahedralNumber(amount) *
      unitPrice *
      feePercentage) / 100;
    uint256 expectedFeeOnSell = (getTetrahedralNumber(amount) *
      unitPrice *
      feePercentage) / 100;

    uint256 expectedFee = expectedFeeOnBuy + expectedFeeOnSell;
    assertEq(address(recipient).balance, expectedFee);
  }

  function testFuzz_InitialBuyPrice(uint8 amount) public {
    uint256 amount = adjustAmount(amount);
    uint256 tokenId = 1;
    uint256 unitPrice = portal.unitPrice();

    assertEq(
      portal.getBuyPrice(tokenId, amount),
      getTetrahedralNumber(amount) * unitPrice
    );

    uint256 expectedBuyPrice = 0;
    for (uint256 i = 1; i <= amount; i++) {
      expectedBuyPrice += getTriangularNumber(i) * unitPrice;
    }

    assertEq(portal.getBuyPrice(tokenId, amount), expectedBuyPrice);
  }

  function testFuzz_getProtocolFee(uint256 price) public {
    assertEq(portal.getProtocolFee(price), price / 100);
  }

  function testFuzz_BalanceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    buyKeys(address(this), tokenId, amount);
    assertEq(portal.balanceOf(address(this), tokenId), amount);
  }

  function testFuzz_BuyPriceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    uint256 unitPrice = portal.unitPrice();
    console.log('amount', amount);

    buyKeys(address(this), tokenId, amount);

    // The next unit of key should cost the triangular number of the total supply
    assertEq(
      portal.getBuyPrice(tokenId, 1),
      getTriangularNumber(amount + 1) * unitPrice
    );
  }

  function testFuzz_SellPriceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    uint256 unitPrice = portal.unitPrice();

    uint256 buyPrice = portal.getBuyPrice(tokenId, amount);
    buyKeys(address(this), tokenId, amount);

    // The sell price of the next unit of key should be the triangular number of the total supply
    assertEq(
      portal.getSellPrice(tokenId, 1),
      getTriangularNumber(amount) * unitPrice
    );

    // The sell price of the same amount should be the same as the buy price
    assertEq(portal.getSellPrice(tokenId, amount), buyPrice);
  }

  function testFuzz_BalanceAfterSell(uint8 amount) public {
    uint256 amount = adjustAmount(amount) * 2;
    uint256 tokenId = 1;

    buyKeys(address(this), tokenId, amount);

    portal.sellKeys(tokenId, amount / 2);

    assertEq(portal.balanceOf(address(this), tokenId), amount - (amount / 2));
  }

  function test_WhenPaused() public {
    portal.pause();
    uint256 tokenId = 1;
    uint256 amount = 10;

    vm.expectRevert("Contract is paused");
    portal.buyKeys(address(this), tokenId, amount, "");

    vm.expectRevert("Contract is paused");
    portal.sellKeys(tokenId, amount);
  }
}
