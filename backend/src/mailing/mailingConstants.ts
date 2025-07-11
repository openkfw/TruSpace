export const registrationConfirmation: Record<
  string,
  Record<string, string>
> = {
  en: {
    subject: "TruSpace: Confirm your registration",
    header: "Dear ",
    text: "You are receiving this e-mail in order to finish your registration and activate your account. Please proceed to the website below to finish the registration process.",
    link: "Confirm registration",
    footer: "Best regards,",
  },
  de: {
    subject: "TruSpace: Bestätigen Sie Ihre Registrierung",
    header: "Hallo ",
    text: "Sie erhalten diese E-Mail, um Ihre Registrierung abzuschließen und Ihr Konto zu aktivieren. Bitte besuchen Sie die unten stehende Website, um den Registrierungsprozess abzuschließen.",
    link: "Registrierung bestätigen",
    footer: "Viele Grüße,",
  },
};

export const passwordReset: Record<string, Record<string, string>> = {
  en: {
    subject: "TruSpace: Reset your password",
    header: "Dear ",
    text: "You are receiving this e-mail as you requested to reset your password. Please proceed to the website below to set new password.",
    link: "Set new password",
    footer: "Best regards,",
  },
  de: {
    subject: "TruSpace: Setze dein Passwort zurück",
    header: "Hallo ",
    text: "Du bekommst diese E-Mail, weil du dein Passwort zurücksetzen möchtest. Klick bitte auf den Link unten, um ein neues Passwort festzulegen.",
    link: "Neues Passwort festlegen",
    footer: "Viele Grüße,",
  },
};

const addedToWorkspace: Record<string, Record<string, string>> = {
  en: {
    subject: "TruSpace: You have been added to a workspace",
    header: "Dear ",
    text: "You are receiving this e-mail because you have been added to a workspace. Please proceed to the website below to see the workspace.",
    link: "Open workspace",
    footer: "Best regards,",
  },
  de: {
    subject: "TruSpace: Du wurdest zu einem Arbeitsbereich hinzugefügt",
    header: "Hallo ",
    text: "Du erhältst diese E-Mail, weil du zu einem Arbeitsbereich hinzugefügt wurdest. Bitte gehe auf die unten stehende Website, um den Arbeitsbereich zu sehen.",
    link: "Arbeitsbereich öffnen",
    footer: "Viele Grüße,",
  },
};

const documentChanged: Record<string, Record<string, string>> = {
  en: {
    subject: "TruSpace: Document has been changed",
    header: "Dear ",
    text: "You are receiving this e-mail because a document you are following has been changed. Please proceed to the website below to see the changes.",
    link: "Open document",
    footer: "Best regards,",
  },
  de: {
    subject: "TruSpace: Dokument wurde geändert",
    header: "Hallo ",
    text: "Du erhältst diese E-Mail, weil ein Dokument, dem du folgst, geändert wurde. Bitte gehe auf die unten stehende Website, um die Änderungen zu sehen.",
    link: "Dokument öffnen",
    footer: "Viele Grüße,",
  },
};

export const notifications = {
  addedToWorkspace,
  documentChanged,
};
