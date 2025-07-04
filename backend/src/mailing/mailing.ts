import nodemailer from "nodemailer";
import SMTPConnection from "nodemailer/lib/smtp-connection";
import * as SMTPTransport from "nodemailer/lib/smtp-transport";
import { config } from "../config/config";
import logger from "../config/winston";

export async function sendEmail(
  emailAddress: string,
  subject: string,
  template: string
) {
  const { smtpServer, emailSender } = config;
  const auth: SMTPConnection.AuthenticationType | undefined =
    !smtpServer.user || !smtpServer.password
      ? undefined
      : {
          user: smtpServer.user,
          pass: smtpServer.password,
        };

  const transportOptions: SMTPTransport.Options = {
    host: smtpServer.host,
    port: smtpServer.port,
    secure: smtpServer.secure,
               // use STARTTLS, not SSL on connect
    requireTLS: smtpServer.tls, 
    auth,
  };

  const transporter = nodemailer.createTransport(transportOptions);
  if (!emailSender) {
    logger.warn(
      `EMAIL_SENDER is empty. This is probably a mistake, and sending email will fail.`
    );
  }
  await transporter.sendMail({
    from: emailSender,
    to: emailAddress,
    subject: subject,
    html: template,
  });
  logger.info(`Email sent to ${emailAddress}`);
}
