```
  ____        _ _          ____ _     ___
 | __ ) _   _| | | __ _   / ___| |   |_ _|
 |  _ \| | | | | |/ _` | | |   | |    | |
 | |_) | |_| | | | (_| | | |___| |___ | |
 |____/ \__,_|_|_|\__,_|  \____|_____|___|
```

> **Experimental** — This project is under active development. APIs and commands may change without notice.

# Bulla CLI

A TypeScript CLI for the [Bulla Protocol](https://bulla.network) — build and send Bulla transactions from the command line.

## Who is this for?

- **AI agents** that prefer CLI over browser-based workflows
- **Scripts and automation** — integrate Bulla payments into CI/CD, cron jobs, or custom tooling
- **Power users** who want to skip the Web UI and backend auth entirely
- **Multisig workflows** — generate unsigned transaction payloads for Safe multi-send batches

## Features

- **Build mode** — generate unsigned transaction payloads without providing a private key. Perfect for Safe multisig, offline signing, or inspection.
- **Execute mode** — sign and broadcast transactions directly from the CLI.
- Supports all 11 Bulla-deployed chains (Ethereum, Base, Arbitrum, Optimism, Polygon, Gnosis, Avalanche, BNB, Celo, RedBelly, Sepolia).
- Built with [Effect](https://effect.website/) for typed errors, dependency injection, and composable workflows.

## Install

```bash
npm install -g @bulla/cli
```

Or run directly with npx:

```bash
npx @bulla/cli --help
```

## Usage

### Instant Payment — Build (unsigned tx)

Generate an unsigned transaction payload. No private key required.

```bash
bulla pay build \
  --chain 11155111 \
  --to 0x1234567890abcdef1234567890abcdef12345678 \
  --amount 1000000000000000000 \
  --description "Payment for services" \
  --tags "consulting,Q4" \
  --format json
```

Output (Safe-compatible):

```json
{
    "to": "0x1cD1A83C2965CB7aD55d60551877Eb390e9C3d7A",
    "value": "1000000000000000000",
    "data": "0x1eb9...",
    "operation": 0
}
```

### Instant Payment — Execute (sign + send)

Sign and send a transaction using a private key:

```bash
bulla pay execute \
  --chain 8453 \
  --to 0x1234567890abcdef1234567890abcdef12345678 \
  --amount 100000000 \
  --token 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 \
  --description "USDC reimbursement" \
  --private-key 0xYourPrivateKey \
  --rpc-url https://base-rpc.example.com
```

### Help

```bash
bulla --help
bulla pay build --help
bulla pay execute --help
```

## Development

```bash
# Install dependencies
yarn install

# Run in development
yarn dev

# Type check
yarn typecheck

# Run tests
yarn test

# Build
yarn build

# Format
yarn format
```

## License

[MIT](LICENSE)
