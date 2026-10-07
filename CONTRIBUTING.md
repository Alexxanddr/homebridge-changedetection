# Contributing

Contributions and bug reports are welcome.

## Development setup

1. Fork and clone the repository.
2. Install a supported Node.js version.
3. Run `npm install`.
4. Create a topic branch.
5. Run `npm run check` before opening a pull request.

Keep pull requests focused. Add or update tests for behavioral changes and update the README when
configuration or user-visible behavior changes.

## Testing with Homebridge

Run `npm link` in this project, then launch a disposable Homebridge instance in debug mode. Do not
test with the only copy of a production Homebridge configuration.

## Reporting issues

Include Homebridge, Node.js, plugin, and changedetection.io versions together with sanitized logs.
Remove tokens, private hostnames, IP addresses, and watched URLs when they are sensitive.

