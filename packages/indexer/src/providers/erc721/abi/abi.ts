import { AbiEvent } from 'abitype';
import ERC721 from './ERC721.json';

export const TRANSFER_EVENT = ERC721.find((abi) => abi.name === 'Transfer') as AbiEvent;
