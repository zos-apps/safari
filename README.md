# 🧭 Safari

> Web browser with search and navigation

Part of the [zOS Apps](https://github.com/zos-apps) ecosystem.

## Installation

```bash
npm install github:zos-apps/safari
```

## Usage

```tsx
import App from '@zos-apps/safari';

function MyApp() {
  return <App />;
}
```

## Package Spec

App metadata is defined in `package.json` under the `zos` field:

```json
{
  "zos": {
    "id": "ai.hanzo.safari",
    "name": "Safari",
    "icon": "🧭",
    "category": "productivity",
    "permissions": ["network"],
    "installable": true
  }
}
```

## Version

v4.2.0

## License

MIT © Hanzo AI
