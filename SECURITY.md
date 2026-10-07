# Security policy

## Supported versions

Security fixes are provided for the latest published version.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting feature instead of opening a public issue.
Include reproduction steps and the affected version, but never include production credentials.

## Deployment guidance

- Use a unique, randomly generated token with at least 16 characters.
- Keep the webhook endpoint on a trusted network whenever possible.
- Use HTTPS when traffic crosses an untrusted network.
- Do not place the token in source control, images, issue reports, or public logs.
- Expose only the webhook port required by this plugin.

