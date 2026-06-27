# Engineering Assessment - Web3 API Endpoint

This project demonstrates a simple Express API endpoint that reads live data from a public Ethereum smart contract.

## Completed Task

Created a new API endpoint in `src/index.js`:

```text
GET /api/nsdApiTest
```

The endpoint reads public ERC-20 token values from Ethereum mainnet. By default, it reads the USDC smart contract:

```text
Contract: USD Coin (USDC)
Address: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
Network: Ethereum mainnet
RPC: https://ethereum-rpc.publicnode.com
```

It fetches:

- Contract name
- Token symbol
- Decimals
- Total supply
- Contract address
- Network

The fetched result is printed to the server console and returned as JSON from the API.

The endpoint also supports a dynamic ERC-20 contract address through a query parameter:

```text
GET /api/nsdApiTest?contractAddress=[ERC20_CONTRACT_ADDRESS]
```

## Quick Start

```bash
npm install
npm start
```

The server starts on port `3001` by default. If that port is busy, the app automatically finds a free port and prints it in the terminal.

Example terminal output:

```text
Backend running on http://localhost:3001
```

## Test the API

Open this URL in a browser or API client:

```text
http://localhost:3001/api/nsdApiTest
```

To test another ERC-20 token, pass a contract address:

```text
http://localhost:3001/api/nsdApiTest?contractAddress=0xdAC17F958D2ee523a2206206994597C13D831ec7
```

Or run:

```bash
curl http://localhost:3001/api/nsdApiTest
```

Example response:

```json
{
  "success": true,
  "data": {
    "contractName": "USD Coin",
    "tokenSymbol": "USDC",
    "decimals": 6,
    "totalSupply": "73123456789.123456",
    "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "network": "Ethereum mainnet"
  }
}
```

The exact `totalSupply` value can change over time because it is read live from the blockchain.

## Console Result

When the endpoint is called successfully, the server console prints:

```text
nsdApiTest smart contract result: {
  contractName: 'USD Coin',
  tokenSymbol: 'USDC',
  decimals: 6,
  totalSupply: '...',
  contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  network: 'Ethereum mainnet'
}
```

## Environment

No API key is required. To use a different Ethereum RPC provider, create a `.env` file:

```env
ETH_RPC_URL=https://your-rpc-url
DEFAULT_CONTRACT_ADDRESS=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
NETWORK_NAME=Ethereum mainnet
PORT=3001
```


