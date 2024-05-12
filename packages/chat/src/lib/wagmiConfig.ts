import { mainnet } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

const config = getDefaultConfig({
  appName: 'creddd',
  projectId: '2ea91e648a2198845fee3ea267ff37dc',
  chains: [mainnet],
  ssr: true,
});

export default config;
