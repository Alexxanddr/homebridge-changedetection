# Publishing

## Before the first release

1. Create an npm account and enable two-factor authentication.
2. Confirm that `homebridge-changedetection` is available on npm.
3. Add an npm automation token to the GitHub repository as the `NPM_TOKEN` Actions secret.
4. Enable GitHub Issues and private vulnerability reporting.
5. Review the package contents with `npm pack --dry-run`.

## Release process

1. Run `npm run check` on a clean checkout.
2. Update `CHANGELOG.md` and commit it.
3. Run `npm version patch`, `npm version minor`, or `npm version major`.
4. Push the commit and tag: `git push --follow-tags`.
5. Create a GitHub release for the tag. The release workflow publishes the matching package version
   to npm with provenance.
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

