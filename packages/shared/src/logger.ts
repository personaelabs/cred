import winston, { createLogger } from 'winston';

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const winstonTransports: any[] = [];

const { DATADOG_API_KEY } = process.env;

export const initLogger = ({ service }: { service: string }) => {
  if (DATADOG_API_KEY) {
    const env = process.env.RENDER_GIT_BRANCH?.replace('/', '-') || 'local';

    console.log(
      `Sending logs to Datadog with service: ${service} and env: ${env}`
    );
    winstonTransports.push(
      new winston.transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=${service}&env=${env}`,
        ssl: true,
        level: 'info',
      })
    );
  } else {
    winstonTransports.push(
      new winston.transports.Console({
        level: 'debug',
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, ...meta }) => {
            delete meta.component;
            return `${level}: ${message} ${JSON.stringify(meta, null, 2)}`;
          })
        ),
      })
    );
  }

  const logger = createLogger({
    defaultMeta: { component: 'winston' },
    transports: winstonTransports,
    format: winston.format.json(),
  });

  return logger;
};
