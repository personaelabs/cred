import { base, anvil, baseSepolia } from 'wagmi/chains';
import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';

const config = createConfig({
  chains: [base, anvil, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(
      `https://base-sepolia.g.alchemy.com/v2/BjrzZCLjdOu3etOMvJrm6HV63zBtxIjA`
    ),
    [anvil.id]: http(),
    // For each of your required chains, add an entry to `transports` with
    // a key of the chain's `id` and a value of `http()`
  },
});

export default config;
