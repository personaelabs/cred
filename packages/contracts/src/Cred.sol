// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';

contract Cred is ERC1155, Ownable {
  uint256 public tokenIdCounter;
  mapping(uint256 => uint256) public tokenIdToSupply;

  constructor()
    ERC1155('https://creddd.xyz/api/cred/{id}.json')
    Ownable(msg.sender)
  {
    tokenIdCounter = 0;
  }

  function getBuyPrice(uint256 tokenId) public view returns (uint256) {
    return 0.01 ether + tokenIdToSupply[tokenId] / 100;
  }

  function getSellPrice(uint256 tokenId) public view returns (uint256) {
    return 0.01 ether + tokenIdToSupply[tokenId] / 100;
  }

  function buyToken(
    address to,
    uint256 tokenId,
    bytes calldata data
  ) public payable {
    // TODO: Set max supply and max amount to prevent overflow
    uint256 price = getBuyPrice(tokenId);

    require(msg.value >= price, 'Insufficient payment');

    _mint(to, tokenId, 1, data);
    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] + 1;
  }

  function sellToken(
    uint256 tokenId
  ) public {
    require(balanceOf(msg.sender, tokenId) >= 1, 'Insufficient balance');

    _burn(msg.sender, tokenId, 1);
    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] - 1;

    uint256 price = getSellPrice(tokenId);

    (bool success, ) = msg.sender.call{ value: price }('');

    require(success, 'Transfer failed');
  }
}
