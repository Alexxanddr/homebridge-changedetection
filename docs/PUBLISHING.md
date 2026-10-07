# Publishing

## Publisher setup

1. Create an npm account and enable two-factor authentication.
2. In the npm package settings, add a GitHub Actions trusted publisher with:
   - user: `Alexxanddr`;
   - repository: `homebridge-changedetection`;
   - workflow filename: `release.yml`;
   - direct `npm publish` permission enabled.
3. Publish a release from the configured workflow before npm's validation deadline.
4. Do not add an `NPM_TOKEN` secret. Publishing uses short-lived OIDC credentials.
5. Enable GitHub Issues and private vulnerability reporting.
6. Review the package contents with `npm pack --dry-run`.

## Release process

1. Run `npm run check` on a clean checkout.
2. Update `CHANGELOG.md` and commit it.
3. Run `npm version patch`, `npm version minor`, or `npm version major`.
4. Push the commit and tag: `git push --follow-tags`.
5. Create a GitHub release for the tag. The release workflow publishes the matching package version
   to npm with automatically generated provenance through trusted publishing.
6. Verify installation in a clean Homebridge environment.

Do not reuse or move release tags. Package versions published to npm are immutable.

## Homebridge discovery

Homebridge UI discovers compatible plugins from npm metadata. This package provides:

- a name beginning with `homebridge-`;
- the `homebridge-plugin` keyword;
- supported Node.js and Homebridge engine ranges;
- a `config.schema.json` platform configuration UI;
- the compiled entry point declared by `main`.

Indexing is not necessarily immediate after the first npm publication.

## Homebridge verified status

Ordinary npm discovery and Homebridge verification are separate. After the project has a stable
release and active maintenance, review the current requirements in the Homebridge plugins repository
and open the requested verification pull request. Verification is a human review and is not automatic.
