export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const retryWithExponentialBackoff = async (
  fn: () => Promise<void>,
  maxRetries = 5
) => {
  let attempt = 0;
  let delay = 1000; // Initial delay in milliseconds

  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed: ${error}`);
      if (attempt === maxRetries - 1) throw new Error('Max retries reached');
      await sleep(delay);
      delay *= 2; // Double the delay for the next attempt
      attempt++;
    }
  }
};

export const buildSiwfMessage = ({
  domain,
  address,
  siweUri,
  nonce,
  issuedAt,
  fid,
}: {
  domain: string;
  address: string;
  siweUri: string;
  nonce: string;
  issuedAt: string;
  fid: number;
}) => {
  return (
    `${domain} wants you to sign in with your Ethereum account:\n` +
    `${address}\n` +
    '\n' +
    'Farcaster Connect\n' +
    '\n' +
    `URI: ${siweUri}\n` +
    'Version: 1\n' +
    'Chain ID: 10\n' +
    `Nonce: ${nonce}\n` +
    `Issued At: ${issuedAt}\n` +
    'Resources:\n' +
    `- farcaster://fid/${fid}`
  );
};
