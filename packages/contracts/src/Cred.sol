// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { ERC1155 } from '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import 'forge-std/console.sol';

contract Cred is ERC1155, Ownable {
  mapping(uint256 => uint256) public tokenIdToSupply;

  uint256 public feePercentage = 1; // 1%
  uint256 public unitPrice = 0.0001 ether;

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

  function setUnitPrice(uint256 _unitPrice) public onlyOwner {
    unitPrice = _unitPrice;
  }

  function getTetrahedralNumber(uint256 n) internal pure returns (uint256) {
    return (n * (n + 1) * (n + 2)) / 6;
  }

  function collectFee(uint256 fee) internal {
    (bool success, ) = feeRecipient.call{ value: fee }('');
    require(success, 'Failed to collect fee');
  }

  /**
  * @dev Get the price of buying a certain amount of keys
    * The price is calculated by the formula:
    * price = unitPrice * (T(n + amount) - T(n))
    * where T(n) is the nth tetrahedral number and n is the current supply of the token
    
    * In other words, the price is the sum of the triangular numbers from n to n + amount
    * \sum_{i=n}^{n+amount} i(i + 1)/2
   */
  function getBuyPrice(
    uint256 tokenId,
    uint256 amount
  ) public view returns (uint256) {
    uint256 supplyBeforeBuy = tokenIdToSupply[tokenId];
    uint256 supplyAfterBuy = tokenIdToSupply[tokenId] + amount;

    return
      unitPrice *
      (getTetrahedralNumber(supplyAfterBuy) -
        getTetrahedralNumber(supplyBeforeBuy));
  }

  /**
   * @dev Get the price of selling a certain amount of keys
   * See `getBuyPrice` for the formula used to calculate the price
   */
  function getSellPrice(
    uint256 tokenId,
    uint256 amount
  ) public view returns (uint256) {
    require(tokenIdToSupply[tokenId] >= amount, 'Insufficient supply');

    uint256 supplyBeforeSell = tokenIdToSupply[tokenId];
    uint256 supplyAfterSell = supplyBeforeSell - amount;

    return
      unitPrice *
      (getTetrahedralNumber(supplyBeforeSell) -
        getTetrahedralNumber(supplyAfterSell));
  }

  /**
   * @dev Get the protocol fee for a given price of trade
   */
  function getProtocolFee(uint256 price) public view returns (uint256) {
    return (price * feePercentage) / 100;
  }

  /**
   * @dev Buy the given amount of keys
   */
  function buyKeys(
    address to,
    uint256 tokenId,
    uint256 amount,
    bytes calldata data
  ) public payable whenNotPaused {
    require(amount > 0, 'Invalid amount');

    uint256 price = getBuyPrice(tokenId, amount);
    uint256 fee = getProtocolFee(price);

    require(msg.value >= price + fee, 'Insufficient payment');

    collectFee(fee);
    _mint(to, tokenId, amount, data);

    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] + amount;
  }

  /**
   * @dev Sell the given amount of keys
   */
  function sellKeys(uint256 tokenId, uint256 amount) public whenNotPaused {
    require(amount > 0, 'Invalid amount');
    require(balanceOf(msg.sender, tokenId) >= amount, 'Insufficient balance');

    uint256 price = getSellPrice(tokenId, amount);
    uint256 fee = getProtocolFee(price);

    _burn(msg.sender, tokenId, amount);
    tokenIdToSupply[tokenId] = tokenIdToSupply[tokenId] - amount;

    collectFee(fee);

    (bool success, ) = msg.sender.call{ value: price - fee }('');
    require(success, 'Transfer failed');
  }
}
