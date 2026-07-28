import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { format, transports } from 'winston';

export const loggerConfig = {
  level: process.env.LOG_LEVEL ?? 'info',

  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.ms(),
        nestWinstonModuleUtilities.format.nestLike(
          process.env.APP_NAME ?? 'QuestService',
          {
            prettyPrint: true,
            colors: process.env.NODE_ENV !== 'production',
          },
        ),
      ),
    }),
  ],
};