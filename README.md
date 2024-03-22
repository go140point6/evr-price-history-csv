# Evernode (EVR) Price History to .csv

This is a very crude and slow way to get price history for EVR to input into Koinly or other tax software.

Generates a .csv in the log folder by pulling historical daily EVR prices from CoinGecko. The prices are posted at 0 UTC each day.

Recommended to only get what you need, as the process is designed to run slowly so not to trip the rate limiting of using the free API endpoint.

Not sure exactly how it trips the rate limit, but I've set it to 15 seconds between calls and if it hits the limit, the script will pause for 65 seconds, adjust as needed.

## Installation
```
git clone https://github.com/go140point6/evr-price-history-csv.git
cd evr-price-history-csv
npm install
```

## Generate .csv
```
node index.js <start_date> ## Format YYYYMMDD i.e. 20240227 (which is also the earliest date available).

node index.js 20240227
```

A .csv with today's datetime will be created in the 'log' directory
