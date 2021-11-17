# rebalancer-react

## Summary

App that would allow one to visualize a portfolio and rebalance it according to some coins allocation defined by the user.

It would be a desktop (Electron) app. The main advantages of being a desktop app instead of a web service like Shrimpy or HodlBot is that the user remains completely in control of its exchange keys. This is more secure and respect the terms of exchanges, which usually forbid their users to share api keys with third-party services.

This app would also allows users to use hardware wallets, which is another advantage over web services. It also allow users to not keep their balances on exchanges.

The app would take care of rebalancing the portfolio. For the first version, this would be on-demand. Future version could allow some form of automatic rebalancing, but this is probably limited fir the app being executing on the desktop. This could be seen as a disadvantage compared to web services. It would need to use an exchange to conduct the trades.

The app could suggests some simple basic portfolio allocations, like market-cap, equal-weights or something in-between like Hodl20 or cci30.
