# Securing the server

TruSpace is designed with security in mind, but there are additional steps you can take to enhance the security of your server. Here are some best practices:

## 1. Use HTTPS

Ensure that your server is configured to use HTTPS. This encrypts the data transmitted between the client and the server, protecting it from eavesdropping and tampering. You can obtain a free SSL certificate from [Let's Encrypt](https://letsencrypt.org/) (as shown in our installation guides).

## 2. Firewall Configuration

Set up a firewall to restrict access to your server. Only allow traffic on the ports that are necessary for TruSpace to function (which you can find in the [Server configuration](../Setup%20TruSpace/Server%20configuration.md) section). Block all other ports to minimize the attack surface.

## 3. Regular Updates

Keep your server's operating system and all installed software up to date. Regularly apply security patches and updates to ensure that any known vulnerabilities are addressed. This includes the TruSpace application itself, as well as any dependencies it relies on.
