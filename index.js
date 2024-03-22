require('dotenv').config();
require('log-timestamp');
const fs = require('fs')
const axios = require('axios')
const { parse } = require('csv-parse');

function logToFile(todayDateHr, data) {
    //const now = new Date();
    //timestamp = `${now.toISOString()}`;
  
    // Append to file
    fs.appendFile(`log/evr-price-history-${todayDateHr}.csv`, `${data}\n`, function (err) {
    if (err) throw err;
    })    
  }

async function main() {
    const startDate = process.argv.length > 2
    ? process.argv[2]
    : ''

    if (!startDate || !/^\d{8}$/.test(startDate)) {
        console.log('Usage: node index.js <start_date>')
        console.log('<start_date> = how far back to go in format YYYYMMDD - REQUIRED')
        console.log('Earliest date possible is 20240227')
        if (process && typeof process.exit == 'function') {
            process.exit(1)
        }
    }

    const year = startDate.slice(0, 4)
    const month = startDate.slice(4, 6)
    const day = startDate.slice(6, 8)

    const earliestDate = new Date(2024, 1, 27) // month is zero-based, so 1 is February
    const inputDate = new Date(year, month - 1, day)
    const todayDate = new Date()

    const yearHr = todayDate.getFullYear()
    const monthHr = String(todayDate.getMonth() + 1).padStart(2, '0')
    const dayHr = String(todayDate.getDate()).padStart(2, '0')
    const hoursHr = String(todayDate.getHours()).padStart(2, '0')
    const minutesHr = String(todayDate.getMinutes()).padStart(2, '0')
    const secondsHr = String(todayDate.getSeconds()).padStart(2, '0')

    const todayDateHr = `${yearHr}${monthHr}${dayHr}_${hoursHr}${minutesHr}${secondsHr}`

    // Coingecko API documentation says the free API only goes back 365 days but I'm not sure that's enforced.
    //const maxFreeApi = new Date(inputDate)
    //maxFreeApi.setDate(maxFreeApi.getDate() - 365)

    // if (inputDate < maxFreeApi) {
    //     console.log('Error: CoinGecko free api only goes back 365 days, use an input date less than one year old.')
    //     if (process && typeof process.exit === 'function') {
    //         process.exit(1)
    //     }
    // }

    if (inputDate < earliestDate) {
        console.log('Error: Use a date that is equal to or greater than 2024027. EVR price data only goes back that far.')
        if (process && typeof process.exit === 'function') {
            process.exit(1)
        }
    }

    // const endTxDate = `${day}-${month}-${year}`
    // console.log("Formatted end date:", endTxDate)

    async function fetchCoinHistory(todayDateHr, currentDate) {
        try {
            const formattedDate = formatDate(currentDate)

            const response = await axios.get('https://api.coingecko.com/api/v3/coins/evernode/history', {
                params: {
                    date: formattedDate
                }
            })
            
            let humanPrice = response.data.market_data.current_price.usd.toFixed(4)
            console.log(`Date: ${formattedDate}, Price: ${humanPrice}`)
            logToFile(todayDateHr,`${formattedDate},${humanPrice}`)
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log('Rate limited. Waiting 65 seconds before continuing.')
                await new Promise(resolve => setTimeout(resolve, 65000))
                await fetchCoinHistory(todayDateHr, currentDate)
            } else {
                console.error(`Error fetching coin history for ${currentDate}:`, error.message)
            }
        }
    }

    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    const currentDate = new Date(inputDate)
    while (currentDate <= todayDate) {
        await fetchCoinHistory(todayDateHr, currentDate)

        // Increment the current date by one for the next iteration
        currentDate.setDate(currentDate.getDate() + 1)

        // Slow down each attempt to try and not trip the rate limit
        await new Promise(resolve => setTimeout(resolve, 13500))
    }
}

main().catch(error => console.error("Error in main:", error))

