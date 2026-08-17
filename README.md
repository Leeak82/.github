# Midnight Crown Casino

A play-money web casino with five tables, a persistent chip wallet, and house rules encoded in tested game engines.

Chips have no cash value. There are no deposits, withdrawals, or real-money wagers.

## Tables

- **Blackjack** — six-deck shoe, dealer stands on 17, naturals pay 3:2, double on the first two cards
- **Roulette** — European single-zero wheel with inside and outside bets
- **Crown Slots** — three-reel, one-line machine
- **Video Poker** — Jacks or Better, 9/6 pay table
- **Baccarat** — punto banco with the standard third-card tableau and 5% banker commission

The bankroll starts at 10,000 chips and is stored in the browser. Open the chip tray in the header to read the ledger, reset, or take a house marker when the tray is empty.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

If Windows PowerShell blocks `npm` (`running scripts is disabled`), either:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

or call `npm.cmd install` and `npm.cmd run dev`.

```bash
npm test
npm run build
```
