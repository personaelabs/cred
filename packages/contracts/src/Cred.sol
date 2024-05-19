// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import 'forge-std/console.sol';

contract Cred is ERC1155, Ownable {
  mapping(uint256 => uint256) public tokenIdToSupply;
  uint256 public protocolFeePercentage = 1; // 1%

  constructor()
    ERC1155('https://creddd.xyz/api/cred/{id}.json')
    Ownable(msg.sender)
  {}

  function getBuyPrice(uint256 tokenId) public view returns (uint256) {
    return 0.01 ether + (tokenIdToSupply[tokenId] * 0.01 ether);
  }

  function getSellPrice(uint256 tokenId) public view returns (uint256) {
    assert(tokenIdToSupply[tokenId] > 0);

    uint256 supplyAfterSell = tokenIdToSupply[tokenId] - 1;
    return 0.01 ether + (supplyAfterSell * 0.01 ether);
  }

  function getProtocolFee(uint256 amount) public view returns (uint256) {
    return (amount * protocolFeePercentage) / 100;
  }

  function buyToken(
    address to,
    uint256 tokenId,
    bytes calldata data
  ) public payable {
    uint256 price = getBuyPrice(tokenId);
    uint256 fee = getProtocolFee(price);

    require(msg.value >= price + fee, 'Insufficient payment');

    _mint(to, tokenId, 1, data);
    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] + 1;
  }

  function sellToken(uint256 tokenId) public {
    require(balanceOf(msg.sender, tokenId) >= 1, 'Insufficient balance');

    uint256 price = getSellPrice(tokenId);
    uint256 fee = getProtocolFee(price);

    _burn(msg.sender, tokenId, 1);
    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] - 1;

    (bool success, ) = msg.sender.call{ value: price - fee }('');

    require(success, 'Transfer failed');
  }
}
