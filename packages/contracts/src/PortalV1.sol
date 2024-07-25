// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import { Ownable } from '@openzeppelin/contracts/access/Ownable.sol';
import 'forge-std/console.sol';

contract PortalV1 is Ownable {
  mapping(uint256 => uint256) public keyIdToPrice;
  mapping(address => mapping(uint256 => bool)) public addressToKeys;

  event KeyPriceSet(uint256 indexed keyId, uint256 price);
  event KeyPurchased(address indexed purchaser, uint256 indexed keyId);

  address public paymentRecipient;

  bool public isPaused = false;

  constructor(address owner) Ownable(owner) {
    paymentRecipient = owner;
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

  function setPaymentRecipient(address _paymentRecipient) public onlyOwner {
    paymentRecipient = _paymentRecipient;
  }

  function setPrice(uint256 keyId, uint256 price) public onlyOwner {
    keyIdToPrice[keyId] = price;

    emit KeyPriceSet(keyId, price);
  }

  function collectPayment(uint256 payment) internal {
    (bool success, ) = paymentRecipient.call{ value: payment }('');
    require(success, 'Failed to collect payment');
  }

  /**
   * @dev Buy a key for the given keyId
   */
  function buyKey(
    address purchaser,
    uint256 keyId
  ) public payable whenNotPaused {
    require(keyIdToPrice[keyId] > 0, 'Key not found');
    require(addressToKeys[purchaser][keyId] == false, 'Key already owned');

    uint256 price = keyIdToPrice[keyId];
    require(msg.value == price, 'Invalid payment');

    addressToKeys[purchaser][keyId] = true;

    collectPayment(price);

    emit KeyPurchased(purchaser, keyId);
  }
}
