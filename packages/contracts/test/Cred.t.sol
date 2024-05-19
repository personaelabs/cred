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

  function buyToken(address to, uint256 tokenId) public payable {
    uint256 buyPrice = cred.getBuyPrice(tokenId);
    uint256 fee = cred.getProtocolFee(buyPrice);

    cred.buyToken{ value: buyPrice + fee }(to, tokenId, '');
  }

  receive() external payable {}

  function test_InitialPrice() public {
    assertEq(cred.getBuyPrice(1), 0.01 ether);
  }

  function testFuzz_getProtocolFee(uint256 price) public {
    assertEq(cred.getProtocolFee(price), price / 100);
  }

  function testFuzz_BalanceAfterBuy(uint8 numBuys) public {
    uint256 tokenId = 1;
    for (uint256 i = 0; i < numBuys; i++) {
      buyToken(address(this), tokenId);
    }
    assertEq(cred.balanceOf(address(this), tokenId), numBuys);
  }

  function testFuzz_PriceAfterBuy(uint8 numBuys) public {
    uint256 tokenId = 1;

    for (uint256 i = 0; i < numBuys; i++) {
      buyToken(address(this), tokenId);
    }

    assertEq(
      cred.getBuyPrice(tokenId),
      0.01 ether + (uint256(numBuys) * 0.01 ether)
    );
  }

  function testFuzz_BalanceAfterSell(uint8 numBuys) public {
    uint256 tokenId = 1;

    for (uint256 i = 0; i < numBuys; i++) {
      buyToken(address(this), tokenId);
    }

    for (uint256 i = 0; i < (numBuys / 2); i++) {
      cred.sellToken(tokenId);
    }

    assertEq(cred.balanceOf(address(this), tokenId), numBuys - (numBuys / 2));
  }
}
