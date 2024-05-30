import winston, { createLogger } from 'winston';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const winstonTransports: any[] = [
  new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message, ...meta }) => {
        delete meta.component;
        return `${level}: ${message} ${JSON.stringify(meta, null, 2)}`;
      })
    ),
  }),
];

const { DATADOG_API_KEY } = process.env;

if (DATADOG_API_KEY) {
  const { RENDER_EXTERNAL_HOSTNAME, RENDER_GIT_BRANCH } = process.env;
  console.log('RENDER_EXTERNAL_HOSTNAME', RENDER_EXTERNAL_HOSTNAME);
  console.log('RENDER_GIT_BRANCH', RENDER_GIT_BRANCH);

  const hostname = RENDER_EXTERNAL_HOSTNAME || 'localhost';
  const env = RENDER_GIT_BRANCH || 'local';

  console.log(
    `Sending logs to Datadog with hostname: ${hostname} and env: ${env}`
  );

  winstonTransports.push(
    new winston.transports.Http({
      host: 'http-intake.logs.datadoghq.com',
      path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&hostname=${hostname}&ddtags=env:${env}`,
      ssl: true,
      level: 'warn',
    })
  );
}

const logger = createLogger({
  defaultMeta: { component: 'winston' },
  transports: winstonTransports,
  format: winston.format.json(),
});

export default logger;
