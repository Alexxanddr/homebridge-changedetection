# Changelog

All notable changes to this project will be documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.6] - 2026-10-07

### Changed

- Render webhook port and reset timeout as precise numeric inputs in Homebridge UI instead of sliders.
- Render watch sensors as editable tabs with an explicit add button in Homebridge UI.

### Fixed

- Prevent HomeKit characteristic and webhook handler errors from terminating a child bridge.
- Update motion state through the Homebridge HAP characteristic instead of a string identifier.

## [0.1.0] - 2026-10-07

### Added

- Dynamic Homebridge platform with one motion sensor per configured watch.
- Authenticated HTTP webhook receiver and unauthenticated health endpoint.
- Homebridge settings schema, tests, documentation, and release automation.

[Unreleased]: https://github.com/Alexxanddr/homebridge-changedetection/compare/v0.1.6...HEAD
[0.1.6]: https://github.com/Alexxanddr/homebridge-changedetection/compare/v0.1.5...v0.1.6
[0.1.0]: https://github.com/Alexxanddr/homebridge-changedetection/releases/tag/v0.1.0
