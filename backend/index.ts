import { config } from "./src/shared/config/config";
import logger from "./src/shared/config/winston";
import app from "./src/app";

const { port } = config;

const startApp = async () => {
  try {
    app.listen(port, () => {
      logger.info(`TruSpace API running and listening on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
};

if (!module.parent) {
  startApp();
}
