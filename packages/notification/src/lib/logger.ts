import winston, { createLogger } from 'winston';

const winstonTransports: any[] = [new winston.transports.Console()];

const { DATADOG_API_KEY } = process.env;

if (DATADOG_API_KEY) {
  const { RENDER_EXTERNAL_HOSTNAME, RENDER_GIT_BRANCH } = process.env;
  console.log('RENDER_EXTERNAL_HOSTNAME', RENDER_EXTERNAL_HOSTNAME);
  console.log('RENDER_GIT_BRANCH', RENDER_GIT_BRANCH);

  winstonTransports.push(
    new winston.transports.Http({
      host: 'http-intake.logs.datadoghq.com',
      path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&hostname=${RENDER_EXTERNAL_HOSTNAME || 'localhost'}&ddtags=env:${RENDER_GIT_BRANCH || 'local'}`,
      ssl: true,
    })
  );
}

const logger = createLogger({
  defaultMeta: { component: 'winston' },
  transports: winstonTransports,
  format: winston.format.json(),
});

export default logger;
