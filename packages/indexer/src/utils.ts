import chalk from 'chalk';
import { Hex, HttpTransport, PublicClient } from 'viem';
import { getNextAvailableClient, releaseClient } from './providers/ethRpc';
import * as chains from 'viem/chains';

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// TODO: Turn this into exponential backoff
export const retry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  interval = 1000
): Promise<T> => {
  let retried = 0;
  let error: any;
  while (true) {
    try {
      return await fn();
    } catch (_err: any) {
      if (retried >= retries) {
        console.log(chalk.red('Retries exhausted'));
        error = _err;
        break;
      } else {
        retried++;
        console.error(_err);
        console.log(chalk.yellow(`Error detected. Retrying... ${retried}`));
        await sleep(interval);
      }
    }
  }

  throw error;
};

/**
 * Run a function concurrently which uses an Ethereum RPC client.
 * We use a pool of clients to run the function concurrently.
 */
export const runInParallel = async <T>(
  fn: (
    client: PublicClient<HttpTransport, chains.Chain>,
    args: T
  ) => Promise<void>, // Function to run in parallel
  args: T[], // List of arguments to pass to fn,
  chain: chains.Chain
) => {
  const numJobs = args.length;

  // Assign each argument an index
  let queuedArgs = args.map((arg, i) => {
    return {
      arg,
      index: i,
    };
  });

  // Keep track of completed jobs
  const completedJobs = new Set<number>();

  while (true) {
    while (queuedArgs.length > 0) {
      const managedClient = getNextAvailableClient(chain);

      if (managedClient) {
        const queuedArg = queuedArgs[0];
        const arg = queuedArg.arg;

        const _promise = fn(managedClient.client, arg)
          .then(() => {
            completedJobs.add(queuedArg.index);
            console.log(
              chalk.green(
                `Completed job ${queuedArg.index}/${args.length} with client ${managedClient.id}`
              )
            );

            // Free the client
            releaseClient(managedClient);
          })
          .catch(err => {
            console.error(err);

            // TODO: Retry the job
            completedJobs.add(queuedArg.index);

            console.log(
              chalk.red(
                `Failed job ${queuedArg.index}/${args.length} with client ${managedClient.id}`
              )
            );
            // Free the client
            releaseClient(managedClient);
          });

        console.log(
          chalk.blue(
            `Started job ${queuedArg.index}/${args.length} with client ${managedClient.id}`
          )
        );

        // Remove the job from the queue
        queuedArgs.shift();
      } else {
        // When there are no available clients, wait 3 seconds and try again
        await sleep(3000);
      }
    }

    if (completedJobs.size === numJobs) {
      console.log(chalk.green('All jobs completed'));
      break;
    }

    await sleep(3000);
  }
};

export const DEV_ADDRESSES: Hex[] = [
  // Dev addresses
  '0x400ea6522867456e988235675b9cb5b1cf5b79c8', // dantehrani.eth
  '0xcb46219ba114245c3a18761e4f7891f9c4bef8c0', // lsankar.eth
  '0x141b63d93daf55bfb7f396eee6114f3a5d4a90b2', // personaelabs.eth

  // Dummy addresses
  '0x783a084c4a945ac47653b87a15bb1aa4124b2d3f',
  '0xbd729fffb73dde9452542c7b11cbd740cf020c55',
  '0x99243341c663451fd0894801d84203b99e8b0cf5',
  '0x4bb5ce4ddc20441fcab83f5bd1b22812ae90449a',
  '0x910536e6e2fa198c941530387c5830b255184f14',
  '0x42795ffa1f5b1685ad009ba5aed4be5545e4bce7',
  '0xb0de8cb8dcc8c5382c4b7f3e978b491140b2bc55',
  '0x56acf53468958bf0e6e2a2e7fd7c8060ef2a0a5a',
  '0xd1518bc90bb99f0d034b6f3763e7fe120fabb1a7',
  '0xe09c78988330bc8017c6e4096aeca59d7bf0f0e6',
  '0xb78f8f8b5434dbcf9b479d0fa0cb43a9984f5acd',
  '0xa2dfe6249f91812e35a4559eb737f015cf3da06d',
  '0xa495d1d6ba95837f3ae136635a9f4c9fded4595f',
  '0x283a28afa7b5df8de5bde804b0a660b7e8e3ed9b',
  '0x9f21e0574b4b585bffbc56e2b5f1b067ee296ec5',
  '0xe6d155781c786806406ff633eaae7a8ada0b5eeb',
  '0x7e20acba7df5b77952d770d763aeb14ebb600d7e',
  '0xdf76828bf1c895542592603cc1896177924d3603',
  '0x9b65cdc6b026d94041f8b7dec1ed125d4a7fa18f',
  '0x3e61ee8fd572cd81d4730f97f583fa237943170b',
  '0x896ae64be834dc345efbb953b9ce2dec7f9ea918',
  '0x8f2ae99bfc07b6018ecc7f2fed666b54e2cfe0a9',
  '0x49c590bf1d64e369ad1536a1fd28972c317e80ed',
  '0xbbc9376daaed34100a4d3a8fe1be843bf43d7597',
  '0x19b6e8dffe9901fef1901abcc553c404e44a489c',
  '0xbe1b3679fa7ff362dc8d9f0630f1f629eb9da55b',
  '0x11d799bb77fb0f3c7b95caa036df4d7ff1924773',
  '0x0dbf08a7bb6522d196fce20bdc05eda10c879841',
  '0x3102bd6716c279ccd9309b18efe1d6f64f8a023c',
  '0x97c1e8671c9c45386a9ec5e8a73661dc9fdcc2c8',
  '0xa48c8060f190b43757ef581226223b97bed09983',
  '0x8d9e73cfb926eeeb8705a2ecb807bfa21e9ebd6b',
  '0xd5b4189894f5acecb1074ecf5eaf0ea81de0a058',
  '0x9652b400a37d427d40ad406ac045555eab3268d5',
  '0xae654cd417a69b7628a2fbaccc5cd0b929ccb5d4',
  '0x53ed41980e1591a0de46396a99bcfb475822bf2c',
  '0x0b73ca1b2125efdcc8bd2c7197598cc68e30c879',
  '0xe4da79a5a3e87540a396c5f2a78d19aaa1a880d3',
  '0x6c323dc2af4dead5ac976ecc0492bc51659808c9',
  '0x3657a77e90168c24a399c0cace0deadb30ca830f',
  '0xe56c216bb9d97fb35c26f9334001371b52d1ab7b',
  '0xe1e3e072c6598afee63b788829cb7d57d597560f',
  '0x09846dca40354e2670ff9f51b25383e1405e38c9',
  '0x088ca70648f415ef539cbd51d389c9635bf6d585',
  '0x17462cdb0eb5e85910b89d204c78440fc676f660',
  '0x25cbb47e1688365cefb9270910f204a7fe646c11',
  '0xe432b6031e32078aa01393fb708785006b5a48bd',
  '0x57b32be0d705559b42fe4be27473e13c68ae640a',
  '0xb91d85953bd9f53e980cd2ba334984ead0c13f0e',
  '0xa28e7fa68bbc5af986f4eb72a7510302728b20b8',
  '0x37c1814024dcccc3ef304fd577a0edcdc49bedcb',
  '0x6ced0d33a4bf506386690b7e262e18293cc3c4dd',
  '0xe9cc729316bb565df1899035cc41803112a5ba7a',
  '0x19f1a80ca3c85fcd5b0f26ab89ef116ab31c927b',
  '0x999bde6f93d75613d3d61ee1d46dc12aa1a34bd1',
  '0xa34b1ea986f578d09807e30449c935a1fc1befc5',
  '0xd25ae8d7343c9962042466715fa8a9c9c09d6c0f',
  '0x798ca317e18579b11fdebab132981daf8847a77e',
  '0x19c1e92f19687ff38548843f4664c3c973886fe9',
  '0xbc48ddffe6e75923490c146a89c50a7dc2340d1e',
  '0xe0f905812dc5613a3f639186ac8e3c8da019a870',
  '0xcecf9393a0ca0750ea4502282818d87126757b15',
  '0x92831f80c351b7bc17c57067d335aef4b73a1555',
  '0x36edb8b6302ff8b777eb3447781dd07a1f6e94cf',
  '0xe265baa03506227b48b0d458d339ac1b945bcb3b',
  '0xf382c72837935f99adadc4bf285dc2201a072355',
  '0xa35d5b18535b715d070badcf20de85d1099c9246',
  '0xe36b0b7cbd375bdc919a458176c0393b4f4823d3',
  '0x9acc4c1089bc1cbfe29427bc9893cde611ccdfe4',
  '0xa78bae0a8cc9b4f4a962ba04e4603aecbcfbb11c',
  '0x2cf157957372997a5a6d93fdbe1f65b8a439a75d',
  '0xbc0fa9927c51f32ab40b917cdee97e613b99ab86',
  '0x0468fbf5ed36c51cd72422354cd4e9d65797fa0f',
  '0xb71ed42ab24846a6560eaca0ff4e8f4ac382a17f',
  '0xfb18c0b2622e684fb4e9eef86c6ce7b3f5e812b5',
  '0xcae457003acb954a6403a70952b0e77f49d1cb4f',
  '0x8d7595ead48c45f99e1ad9d803b11a78f7b317c7',
  '0x5980a9b603711d7545a3d35698afddf3c388ed97',
  '0x043c5351ea92bbb5ac1052c5d9aa08dde873a878',
  '0xfedc76d1bd8858078a4e0006d1512f68ddb2e577',
  '0x51197e56172871fc55683c1daac041d4e69254ce',
  '0xf802bb1b149f1602711c4afd4758bb193baae202',
  '0x68a405ca2880aea27311fe97b5bffcf48007fd55',
  '0x9416dfdb3affe3a53aa6cde34fc81e1dc5b9598d',
  '0x2c4503bf46095d42877c7c1d58a7a72c72c13faf',
  '0x34d131ef7f2ee45ad2ec2e9ac0e3f04b8fd0a052',
  '0x435c1e9f3874c9f808d48ab678512936bfc6c289',
  '0xb921b42a595d1b18ae57e868d04ffb77aabdb425',
  '0x2c6e838ccd58d6e6641592e5b61f43bc7c2e26e6',
  '0xd7a21f5fea03e203a8a301dd01d11c7e07db2acb',
  '0x219311d112222c88c3f946152cf769fbedc20546',
  '0xd6267a59676ae9c4afa51f5bf06966c51afe6d8e',
  '0x0b5239e551d45cbf9913c228a2f7a12fb5227e90',
  '0xb10e5bade5e5e6a0ea166cb019d9f7cfc13bc785',
  '0x93878cd84b4ae9d4ee7aeebf9f8feb714baeeb31',
  '0xd63af53bb711f172f9466bc640d70c6ea49adf33',
  '0x7f5b3f7044f92937da7965cf3976ba09a822aad7',
  '0xc2feb744002773097f9bfae8dd538e97feb8e9fe',
  '0x84a742665c78e8260e8affbf972173491db476f4',
  '0x6bfbf61b095091a2238953572a1976a6eb5bb10a',
];
