import nodemailer from "nodemailer";

export function mailService(config) {
  const transport =
    config.driver === "smtp"
      ? nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          ...(config.username
            ? { auth: { user: config.username, pass: config.password } }
            : {}),
        })
      : null;
  return {
    async send(message) {
      if (transport)
        return transport.sendMail({
          from: { name: config.from.name, address: config.from.address },
          ...message,
        });
      if (process.env.NODE_ENV === "production")
        throw new Error(
          "Configure MAIL_DRIVER=smtp to send password reset emails.",
        );
      console.info(
        "Development email:",
        message.to,
        message.subject,
        message.text,
      );
      return { logged: true };
    },
  };
}
