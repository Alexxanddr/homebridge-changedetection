# homebridge-changedetection

[![CI](https://github.com/Alexxanddr/homebridge-changedetection/actions/workflows/ci.yml/badge.svg)](https://github.com/Alexxanddr/homebridge-changedetection/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/homebridge-changedetection)](https://www.npmjs.com/package/homebridge-changedetection)

A Homebridge dynamic platform plugin that turns
[changedetection.io](https://github.com/dgtlmoon/changedetection.io) webhook notifications into
HomeKit motion sensor events.

Each configured watch appears as a separate motion sensor in Apple Home. Use that sensor as the
trigger for automations that control lights, scenes, switches, notifications, and other accessories.

## Features

- Push-based: events arrive immediately through a webhook; no polling or API key is required.
- One independent HomeKit motion sensor per changedetection.io watch.
- Works with self-hosted and hosted changedetection.io instances.
- Shared-secret authentication with constant-time comparison.
- Built-in Homebridge settings UI schema.
- No cloud service, analytics, or product-specific infrastructure.

## Requirements

- Homebridge 1.8 or 2.x
- Node.js 22.10 or 24.x
- Network access from changedetection.io to the Homebridge webhook port

## Installation

Search for **ChangeDetection** in Homebridge UI, or install it from a terminal:

```shell
npm install --global homebridge-changedetection
```

The package will appear in Homebridge's plugin search after it has been published to npm. A GitHub
repository by itself is not enough for registry discovery.

## Homebridge configuration

The recommended method is Homebridge UI. Add the platform, generate a random token of at least 16
characters, and create one sensor for each watch.

Equivalent `config.json` example:

```json
{
  "platform": "ChangeDetection",
  "name": "ChangeDetection",
  "port": 3210,
  "bindAddress": "0.0.0.0",
  "token": "replace-with-a-long-random-secret",
  "resetAfterSeconds": 10,
  "sensors": [
    {
      "id": "product-stock",
      "name": "Product stock changed"
    },
    {
      "id": "release-page",
      "name": "New software release"
    }
  ]
}
```

Sensor IDs are user-defined stable identifiers. They do not need to match changedetection.io watch
UUIDs, although using a watch UUID is supported.

## Configure changedetection.io

For each watch, open **Edit > Notifications** and add a POST notification URL that targets the
matching sensor ID:

```text
post://HOMEbridge_HOST:3210/webhook/product-stock?+x-changedetection-token=YOUR_TOKEN
```

Use `posts://` when the webhook endpoint is behind HTTPS. The `+` prefix tells Apprise to send the
query parameter as an HTTP header rather than in the request URL.

Set the notification body to a small valid JSON document:

```json
{
  "title": {{ watch_title | tojson }},
  "url": {{ watch_url | tojson }},
  "watch_uuid": {{ watch_uuid | tojson }}
}
```

The plugin currently ignores the body; it is included for useful logging and future compatibility.
The sensor is selected exclusively by the URL path.

Use changedetection.io's **Send test notification** action, then check the Homebridge log and Apple
Home. The sensor should become active and return to inactive after `resetAfterSeconds`.

### Test with curl

```shell
curl --request POST \
  --header 'X-ChangeDetection-Token: YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{}' \
  http://HOMEbridge_HOST:3210/webhook/product-stock
```

Health checks are available without authentication:

```shell
curl http://HOMEbridge_HOST:3210/health
```

## Containers and reverse proxies

Expose TCP port `3210` from the Homebridge container, or route it only on a trusted internal network.
The webhook does not need to be publicly accessible when changedetection.io and Homebridge can
communicate locally.

If a reverse proxy terminates TLS, forward POST requests to the configured webhook port and retain
the `X-ChangeDetection-Token` header. Do not publish the endpoint without authentication.

## Apple Home automations

Create an automation using the sensor event **Detects Motion**. For example:

1. When `Product stock changed` detects motion;
2. turn on a light or activate a scene;
3. optionally turn it off after a delay.

The plugin resets the sensor automatically so a later website change can trigger the automation
again.

## Troubleshooting

- **Plugin is not configured**: add at least one sensor and a token containing 16 or more characters.
- **401 Unauthorized**: the `X-ChangeDetection-Token` header does not match the configured token.
- **404 Unknown sensor**: the final URL segment must exactly match a configured sensor ID.
- **Connection refused**: expose the configured port and verify routing between the two services.
- **No Apple Home automation**: confirm the sensor changes state in the Homebridge log first.

## Development

```shell
npm install
npm run check
npm link
homebridge -D
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the contribution workflow and
[docs/PUBLISHING.md](docs/PUBLISHING.md) for the release process.

## Security

See [SECURITY.md](SECURITY.md). Never include a real webhook token in issues, screenshots, or logs.

## License

[MIT](LICENSE)

