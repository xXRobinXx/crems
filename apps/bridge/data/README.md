# Belgian day-ahead price archive

`belpex-day-ahead-2021-09-01_2026-08-31.csv` is a normalized local research snapshot used for historical CREMS simulations.

- Source: Elexys public XLSX exports of Belgian EPEX/Belpex day-ahead prices.
- Underlying market data: EPEX SPOT Belgium.
- Hourly products are used before 1 October 2025.
- Quarter-hourly products are used from 1 October 2025 onward.
- Prices are wholesale `EUR/MWh`, excluding supplier markup, VAT, network tariffs and levies.
- Local Belgian timestamps are converted to UTC; duplicated winter-hour labels are distinguished with both timezone folds.
- No missing interval is interpolated.

Source pages:

- https://www.elexys.be/en/insights/epex-spot
- https://www.elexys.be/en/insights/quarter-hourly-belpex-day-ahead-spot-be

The reproducible conversion script is `research/scripts/build-belpex-price-history.py`. Refreshing this snapshot requires revalidating coverage and the upstream export format.
