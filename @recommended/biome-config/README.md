# @recommended/biome-config

## Install

```bash
yarn add @biomejs/biome @recommended/biome-config --dev
```

## Usage

Update the `biome.json`:

```json
{
  "extends": ["@recommended/biome-config"]
}
```

Update the `package.json`:

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "lint:fix-unsafe": "biome check --apply-unsafe ."
  }
}
```
