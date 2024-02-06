import { AbiEvent } from 'abitype';
import ERC20 from './ERC20.json';

export const TRANSFER_EVENT = ERC20.find((abi) => abi.name === 'Transfer') as AbiEvent;
