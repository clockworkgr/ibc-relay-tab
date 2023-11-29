# IBC Relay Tab

This project implements a web-based IBC relayer.

Requirements:
- a funded Keplr Wallet

If you want to run this locally:
- NodeJS v20
- pnpm

First clone the repo. 

Then:
```
cd ibc-relay-tab
pnpm install
pnpm dev
```

Open your browser at the provided URL (usually `localhost:5173`), pick 2 chains to relay between and click `CONNECT` to set up the light clients.

Click `RELAY` to start relaying packets (you will still have to manually approve signing in Keplr). 
Click `STOP` to stop relaying.

By default, this webapp only relays packets for `ibc.applications.transfer` where the sender or receiver is you as discovered through Keplr.

If you want to add additional filtering functionality (more exclusive or inclusive or for other IBC apps) you will have to write your own packet filter as defined in https://github.com/confio/ts-relayer/pull/275.

The current filter implementation can be found here:



