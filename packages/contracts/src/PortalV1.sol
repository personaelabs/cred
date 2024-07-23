// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import 'forge-std/console.sol';

contract PortalV1 is ERC1155, Ownable {
  uint256 public feePercentage = 5; // 5%
  uint256 public price = 0.0001 ether;

  address public feeRecipient;

  bool public isPaused = false;

  constructor()
    ERC1155('https://creddd.xyz/api/cred/{id}.json')
    Ownable(msg.sender)
  {
    feeRecipient = msg.sender;
  }

  modifier whenNotPaused() {
    require(!isPaused, 'Contract is paused');
    _;
  }

  function pause() public onlyOwner {
    isPaused = true;
  }

  function resume() public onlyOwner {
    isPaused = false;
  }

  function setFeeRecipient(address _feeRecipient) public onlyOwner {
    feeRecipient = _feeRecipient;
  }

  function setFeePercentage(uint256 _feePercentage) public onlyOwner {
    feePercentage = _feePercentage;
  }

  function setPrice(uint256 _price) public onlyOwner {
    price = _price;
  }

  function collectFee(uint256 fee) internal {
    (bool success, ) = feeRecipient.call{ value: fee }('');
    require(success, 'Failed to collect fee');
  }

  /**
   * @dev Get the protocol fee for a given price of trade
   */
  function getProtocolFee(uint256 _price) public view returns (uint256) {
    return (_price * feePercentage) / 100;
  }

  /**
   * @dev Buy a key for the given tokenId
   */
  function buyKey(
    address to,
    uint256 tokenId,
    bytes calldata data
  ) public payable whenNotPaused {
    uint256 fee = getProtocolFee(price);

    require(msg.value >= price + fee, 'Insufficient payment');

    collectFee(fee);
    _mint(to, tokenId, 1, data);
  }

  /**
   * @dev Sell a key for the given tokenId
   */
  function sellKey(uint256 tokenId) public whenNotPaused {
    require(balanceOf(msg.sender, tokenId) >= 1, 'Insufficient balance');

    uint256 fee = getProtocolFee(price);

    _burn(msg.sender, tokenId, 1);

    collectFee(fee);

    (bool success, ) = msg.sender.call{ value: price - fee }('');
    require(success, 'Transfer failed');
  }
}
