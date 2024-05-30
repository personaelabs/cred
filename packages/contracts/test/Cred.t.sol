pragma solidity ^0.8.13;
import 'forge-std/Test.sol';
import '../src/Cred.sol';
import 'forge-std/console.sol';
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { IERC1155Receiver } from '@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol';

contract ContractBTest is Test, IERC1155Receiver {
  Cred cred;

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
    cred = new Cred();
  }

  /**
   ********* Utility functions *********
   */

  function buyKeys(address to, uint256 tokenId, uint256 amount) public payable {
    uint256 buyPrice = cred.getBuyPrice(tokenId, amount);
    uint256 fee = cred.getProtocolFee(buyPrice);

    cred.buyKeys{ value: buyPrice + fee }(to, tokenId, amount, '');
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
    cred.setFeePercentage(percentage % 100);
    assertEq(cred.feePercentage(), percentage % 100);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    cred.setFeePercentage(percentage % 100);
  }

  function testFuzz_setFeeRecipient(address recipient) public {
    cred.setFeeRecipient(recipient);
    assertEq(cred.feeRecipient(), recipient);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    cred.setFeeRecipient(recipient);
  }

  function testFuzz_setUnitPrice(uint256 price) public {
    cred.setUnitPrice(price);
    assertEq(cred.unitPrice(), price);

    vm.prank(address(makeAddr("alice")));
    vm.expectRevert();
    cred.setUnitPrice(price);
  }

  function test_ProtocolFeeCollection() public {
    address recipient = vm.addr(333);
    cred.setFeeRecipient(recipient);

    uint8 amount = 10;
    uint256 tokenId = 1;
    buyKeys(address(this), tokenId, amount);

    cred.sellKeys(tokenId, amount);

    uint256 feePercentage = cred.feePercentage();
    uint256 unitPrice = cred.unitPrice();

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
    uint256 unitPrice = cred.unitPrice();

    assertEq(
      cred.getBuyPrice(tokenId, amount),
      getTetrahedralNumber(amount) * unitPrice
    );

    uint256 expectedBuyPrice = 0;
    for (uint256 i = 1; i <= amount; i++) {
      expectedBuyPrice += getTriangularNumber(i) * unitPrice;
    }

    assertEq(cred.getBuyPrice(tokenId, amount), expectedBuyPrice);
  }

  function testFuzz_getProtocolFee(uint256 price) public {
    assertEq(cred.getProtocolFee(price), price / 100);
  }

  function testFuzz_BalanceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    buyKeys(address(this), tokenId, amount);
    assertEq(cred.balanceOf(address(this), tokenId), amount);
  }

  function testFuzz_BuyPriceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    uint256 unitPrice = cred.unitPrice();
    console.log('amount', amount);

    buyKeys(address(this), tokenId, amount);

    // The next unit of key should cost the triangular number of the total supply
    assertEq(
      cred.getBuyPrice(tokenId, 1),
      getTriangularNumber(amount + 1) * unitPrice
    );
  }

  function testFuzz_SellPriceAfterBuy(uint8 amount) public {
    uint256 amount = adjustAmount(amount);

    uint256 tokenId = 1;
    uint256 unitPrice = cred.unitPrice();

    uint256 buyPrice = cred.getBuyPrice(tokenId, amount);
    buyKeys(address(this), tokenId, amount);

    // The sell price of the next unit of key should be the triangular number of the total supply
    assertEq(
      cred.getSellPrice(tokenId, 1),
      getTriangularNumber(amount) * unitPrice
    );

    // The sell price of the same amount should be the same as the buy price
    assertEq(cred.getSellPrice(tokenId, amount), buyPrice);
  }

  function testFuzz_BalanceAfterSell(uint8 amount) public {
    uint256 amount = adjustAmount(amount) * 2;
    uint256 tokenId = 1;

    buyKeys(address(this), tokenId, amount);

    cred.sellKeys(tokenId, amount / 2);

    assertEq(cred.balanceOf(address(this), tokenId), amount - (amount / 2));
  }

  function test_WhenPaused() public {
    cred.pause();
    uint256 tokenId = 1;
    uint256 amount = 10;

    vm.expectRevert("Contract is paused");
    cred.buyKeys(address(this), tokenId, amount, "");

    vm.expectRevert("Contract is paused");
    cred.sellKeys(tokenId, amount);
  }
}
