import { base, anvil } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';

const config = createConfig({
  chains: [base, anvil],
  transports: {
    [base.id]: http(),
    [anvil.id]: http(),
    // For each of your required chains, add an entry to `transports` with
    // a key of the chain's `id` and a value of `http()`
  },
});

export default config;
