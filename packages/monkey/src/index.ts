import 'dotenv/config';
import { startMessageMonkey } from './messageMonkey';
import { startUserMonkey } from './userMonkey';
import { startTradeMonkey } from './tradeMonkey';

const startMonkey = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.IS_PULL_REQUEST === 'true'
  ) {
    await Promise.all([
      startMessageMonkey(),
      startUserMonkey(),
      startTradeMonkey(),
    ]);
  } else {
    console.log(
      'Not running monkey because the deployment is not a pull request or development environment.'
    );
  }
};

startMonkey();
