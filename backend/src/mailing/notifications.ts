import path from "path";
import { getUserSettings } from "../utility/user";
import * as fs from "fs";
import { compile } from "handlebars";
import { config } from "../config/config";
import logger from "../config/winston";
import { notifications } from "./mailingConstants";
import { sendEmail } from "./mailing";

// Define the type for notificationType based on the keys of notifications
type NotificationType = keyof typeof notifications;

export const sendNotification = async (
  email: string,
  notificationType: NotificationType,
  url: string,
  title: string
) => {
  const userSettings = await getUserSettings(email);
  if (userSettings) {
    const notificationSettings = userSettings.notificationSettings;
    if (notificationSettings?.[notificationType]) {
      const filePath = path.join(
        process.cwd(),
        "src/mailing/templates/notification.html"
      );
      const source = fs.readFileSync(filePath, "utf-8");
      const template = compile(source);
      const lang = userSettings.preferedLanguage || "en";
      if (!notifications[notificationType]) {
        logger.warn(
          `Notification type ${notificationType} is not defined in notifications constants`
        );
        return;
      }
      const texts = notifications[notificationType][lang];
      const replacements = {
        lang,
        header: texts.header,
        user: email,
        text: texts.text,
        workspaceUrl: config.frontendUrl + url,
        workspaceTitle: title,
        footer: texts.footer,
      };
      const htmlTemplateToSend = template(replacements);
      logger.info("Sending email done");
      await sendEmail(
        email,
        texts.subject,
        htmlTemplateToSend
      );
    } else {
      logger.info(
        `Notification type ${notificationType} is disabled for user ${email}`
      );
    }
  }
};
