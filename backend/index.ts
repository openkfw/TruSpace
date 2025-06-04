import app from "./src/app";
import { config } from "./src/config/config";
import logger from "./src/config/winston";

const { port } = config;

const startApp = async () => {
  try {
    app.listen(port, () => {
      logger.info(`Truspace API running and listening on port ${port}`);
    });
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
};

if (!module.parent) {
  startApp();
}
