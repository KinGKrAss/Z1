# Orbs TON Access in Z1

Z1 exposes a read-only adapter for the TON mainnet through Orbs TON Access.
The adapter discovers healthy Orbs endpoints and can read the native TON
balance for a TON address. It does not connect to a wallet, store keys, sign
transactions, broadcast transfers, or verify ownership of an address.

## API

- GET /api/networks/orbs-ton/status checks Orbs TON Access endpoint discovery
  and reports the number of healthy TON RPC nodes. It links to the Orbs status
  page for the provider's incident view.
- GET /api/networks/orbs-ton/balance?address=<TON address> reads the native
  TON balance and returns both nanoTON and TON values.

The adapter defaults to mainnet. Set ORBS_TON_NETWORK=testnet for testing.
Only mainnet and testnet are accepted.

## Scope

Orbs TON Access is a TON RPC gateway operated through Orbs network nodes. It is
not a universal coin network and does not move unrelated assets onto Orbs.
This adapter reads native TON only. Jetton balances and assets on Ethereum,
Polygon, Bitcoin, or other chains need separate chain-specific readers.
Read-only results are provider responses and should be labelled with their
network and check time in any portfolio view.

## Checks

Run npm run test:orbs-ton to test node filtering, balance conversion, and
address validation without contacting the live network.
