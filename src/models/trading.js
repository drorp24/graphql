import axios from 'axios'
import interval from 'interval-promise'

import pubsub from '../subscriptions/pubsub'
import { TRADING_UPDATED } from '../subscriptions/events'
import moize from 'moize'

// UPDATE: eventually not used: couldn't produce the right object, plus validation threw inspite of the catch
// mongoose used here solely for its schema, as nothing is read or persisted to/from DB
// 1. To validate (with mongoose you can declaratively rule that currency have 3 characters, not in graphql)
// 2. To practice sub-sub-documents access and traversal
/*
const priceSchema = new mongoose.Schema({
  currency: { type: currencySchema, required: true },
  price: Number,
})

const tradeSchema = new mongoose.Schema({
  coin: { type: currencySchema, required: true },
  prices: [{ type: priceSchema, required: true }],
})

const tradingSchema = new mongoose.Schema({
  time: String,
  trading: [{ type: tradeSchema, required: true }],
})
*/

export default class Trading {
  static async current({ coins, currencies }) {
    try {
      const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coins.join(
        ',',
      )}&tsyms=${currencies.join(',')}&api_key=${
        process.env.CRYPTO_COMPARE_PASSWORD
      }`
      const response = await axios.get(url)
      const data = response.data

      let current = { time: 'CURRENT', trading: [] }
      let coinIndex = 0
      let currency, price, prices

      coins.forEach(coin => {
        current.trading.push({ coin })
        prices = []
        for ([currency, price] of Object.entries(data[coin])) {
          prices.push({ currency, price })
        }
        current.trading[coinIndex].prices = prices
        coinIndex++
      })

      return current
    } catch (error) {
      console.log(error)
    }
  }
}

export const startPolling = args => {
  const { coins, currencies, int } = args

  async function poll() {
    let current = await Trading.current({ coins, currencies })
    pubsub.publish(TRADING_UPDATED, { tradingUpdated: current })
    return current
  }

  interval(async () => {
    await poll()
  }, int)
}

export const nonMemoizedInterbank = async ({ base, quote }) => {
  try {
    const url = `https://min-api.cryptocompare.com/data/price?fsym=${base}&tsyms=${quote}&api_key=${
      process.env.CRYPTO_COMPARE_PASSWORD
    }`
    const response = await axios.get(url)
    const data = response.data
    return data[quote]
  } catch (error) {
    console.log('error in rate: ', error)
  }
}

moize.collectStats()

// moize wouldn't cache properly without the 'equals' part! though 'base' & 'quote' are the only arguments!
export const interbank = moize({
  maxAge: 300000,
  profileName: 'interbank',
  equals(cacheKeyArgument, keyArgument) {
    return (
      cacheKeyArgument.base === keyArgument.base &&
      cacheKeyArgument.quote === keyArgument.quote
    )
  },
})(nonMemoizedInterbank)
