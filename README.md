# Midnight Crown Casino

A free-play web casino. Chips are not money. There are no deposits, withdrawals, or real bets. This project is not connected to any real casino.

## Games

- **Blackjack** - six-deck shoe, dealer stands on 17, blackjack pays 3 to 2, double allowed
- **Roulette** - European wheel with one zero
- **Lucky 7 Slots** - five reels that spin with staggered stops (same Web Animations approach as [johakr/html5-slot-machine](https://github.com/johakr/html5-slot-machine), MIT), 1 to 20 paylines, Wilds, Stars, coin sizes, Max Bet, Autoplay
- **Video Poker** - Jacks or Better, 9/6 pay table
- **Baccarat** - Player, Banker, or Tie. Banker wins pay 0.95 to 1

You start with 10,000 chips saved in the browser. Click **Chips** for history. If you run out, click **Free chips**.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

If Windows PowerShell blocks `npm` (`running scripts is disabled`):

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

or use `npm.cmd install` and `npm.cmd run dev`.

```bash
npm test
npm run build
```

Sound starts after you click **Play now** or **Sound: On**. If you hear nothing, check that the button says **Sound: On** and that the tab is not muted.
