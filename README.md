# Fronius Auth Proxy — Home Assistant Addon

A Home Assistant addon that acts as an HTTP proxy for your Fronius inverter, handling HTTP digest authentication automatically. This lets Home Assistant `rest_command` calls control the inverter without dealing with digest auth.

Based on [sergioperez/fronius-auth-proxy](https://github.com/sergioperez/fronius-auth-proxy).

## Installation

1. In Home Assistant, go to **Settings → Add-ons → Add-on Store**.
2. Click the three-dot menu (⋮) in the top-right and choose **Repositories**.
3. Add this repository URL and click **Add**.
4. Find **Fronius Auth Proxy** in the store and click **Install**.

## Configuration

| Option | Description | Default |
|---|---|---|
| `fronius_hostname` | IP address or hostname of your Fronius inverter | _(required)_ |
| `fronius_port` | HTTP port of the inverter | `80` |
| `fronius_username` | Inverter username | `service` |
| `fronius_password` | Inverter password | _(required)_ |

Example addon configuration:

```yaml
fronius_hostname: "192.168.1.100"
fronius_port: 80
fronius_username: "service"
fronius_password: "your-password"
```

## Usage in Home Assistant

Once the addon is running, add a `rest_command` to your `configuration.yaml`. The proxy listens on port `3000`; only the `path` query parameter is required per-request since `hostname`, `port`, `username`, and `password` are read from the addon configuration.

```yaml
input_number:
  fronius_soft_limit:
    name: "Fronius soft limit"
    initial: 4000
    min: 150
    max: 4000
    step: 50

rest_command:
  fronius_set_soft_limit:
    url: "http://homeassistant:3000/request?path=/config/exportlimit/?method=save"
    method: POST
    content_type: application/json
    payload: >
      {
        "powerLimits": {
          "exportLimits": {
            "activePower": {
              "hardLimit": {
                "enabled": false,
                "powerLimit": 0
              },
              "mode": "entireSystem",
              "softLimit": {
                "enabled": true,
                "powerLimit": {{ states('input_number.fronius_soft_limit') | int }}
              }
            },
            "failSafeModeEnabled": false
          },
          "visualization": {
            "exportLimits": {
              "activePower": {
                "displayModeHardLimit": "absolute",
                "displayModeSoftLimit": "absolute"
              }
            },
            "wattPeakReferenceValue": 4000
          }
        }
      }
```

You can also override the inverter connection details per-request via query parameters (`hostname`, `port`, `username`, `password`) if needed.

## How it works

Fronius inverters use HTTP digest authentication, which Home Assistant's `rest_command` does not support natively. This proxy:

1. Receives a plain HTTP request from Home Assistant.
2. Makes an initial unauthenticated request to the inverter to obtain the digest challenge.
3. Computes the digest auth header using the configured credentials.
4. Replays the request with proper authentication and returns the response.

## Notes

- This addon uses the same digest auth library as the Fronius web UI.
- A Fronius firmware update may break this functionality.
- See the [original project](https://github.com/sergioperez/fronius-auth-proxy) for more background.
