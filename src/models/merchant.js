// * mongoose schema
// Not to be confused with graphQl schema, this is the DB-level one. It's equivalent to RoR schema
// GraphQl schema is where instance and class-level methods are defined, and it's equivalent to RoR model
// To confuse the hell out of me, the RoR schema-equivalent is in a folder named 'models',
// and the RoR model-equivalent is in a folder named 'schema'
// Anyway:
// - 'schema' folder has the pure-graphql schema that's exposed to the client / graphiql / playground
// - 'resolvers' is the layer b/w the pure-graphql schema and the implementation (mongoose, in my case)
// - 'models' is the mongoose implementation

// Each of the model methods can respond to its caller in either of 3 ways:
// - returning string result / error (or: Promise.reject/resolve if async) - when called from other methods
// - returning a mongoose query, which is a promise (Apollo will await it to resolve) - when called from resolvers
// - returning a simple obj in the schema declared format, with error or success - if no async query is passed

import mongoose from 'mongoose'
import { currencySchema } from './common'
import { specified } from '../resolvers/utility'
import { interbank } from './trading'
import moize from 'moize'

// TODO: remove _id declarations
export const quotationSchema = new mongoose.Schema({
  // _id: mssongoose.Schema.Types.ObjectId,
  currency: { type: String, required: true },
  buy: Number,
  sell: Number,
})

const pointSchema = new mongoose.Schema({
  // _id: mongoose.Schema.Types.ObjectId,
  type: { type: String, required: true, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
})

const merchantSchema = new mongoose.Schema({
  // _id: mongoose.Schema.Types.ObjectId,
  place_id: String,
  name: { type: String, required: true },
  name_he: String,
  address: String,
  address_he: String,
  email: String,
  phone: String,
  delivery: Boolean,
  delivery_charge: Number,
  currency: { type: currencySchema, required: true },
  location: { type: pointSchema, required: true },
  quotations: [quotationSchema],
})

// virtual
merchantSchema.virtual('delivers').get(function() {
  return this.delivery
})

// instance methods

// GraphQL looks for:
// - function in the resolver
// - instance method in the model, like here (implemented by mongoose)
// - key in the object model (populated by mongoose with the DB value)

// Important:
// ! Arrow functions should not be used whenever I want access to 'this' (= merchant record)

// * Caching of calculated fields
// While there are libraries to cache DB-retrieved values
// some calculated fields require caching too, which calls for using a pure function caching solution such as moize
// This is the recipe to do it:

// Being a merchantSchema.methods key (and not an arrow function), 'quotation' has access to the merchant record
// It adds an 'id' argument to memoizedQuotation (to compare keys) and nonMemoizedQuotation (which is not interested but has to have it)
// for the sheer purpose of caching quotation per merchant (id), base & quote

// In real-life, merchant's quotations would be populated by a different process, certinaly not the web
// But since here merchant's quotations are fabricated with each call (by upmarking a (cached) interbank rate)
// and since both 'quote' and 'quotation' can be shown at the same time  and quote' calls 'quotation'
// caching quotation becomes a necessity or else the two fields will not match

merchantSchema.methods.quotation = async function({
  product: { base, quote },
}) {
  const { id } = this
  const result = await memoizedQuotation({ id, base, quote })
  return result
}

const nonMemoizedQuotation = async ({ id, base, quote }) => {
  try {
    const MARGIN_LOW = 3
    const MARGIN_HIGH = 5
    const random = Math.random()
    const margin = (MARGIN_LOW + (MARGIN_HIGH - MARGIN_LOW) * random) / 100

    const interbankRate = await interbank({ base, quote })
    const rate = interbankRate * (1 + margin)
    const created = Date.now()

    return { base, quote, rate, created }
  } catch (error) {
    console.log('merchantSchema.methods.quotation error: ', error)
    return Promise.reject(error)
  }
}

// ! always call moize(fn) after fn is defined
const memoizedQuotation = moize({
  maxAge: 120000,
  profileName: 'quotation',
  equals(cacheKeyArgument, keyArgument) {
    return (
      cacheKeyArgument.id === keyArgument.id &&
      cacheKeyArgument.base === keyArgument.base &&
      cacheKeyArgument.quote === keyArgument.quote
    )
  },
})(nonMemoizedQuotation)

// 'quote' can now  safely call 'quotation', resting asured its value would be identical to that of 'quotation' itself
merchantSchema.methods.quote = async function({ product, amount }) {
  const { base, quote } = product
  try {
    const quotation = await this.quotation({ product })
    const price = quotation.rate * amount
    const created = Date.now()
    return { base, quote, amount, price, created }
  } catch (error) {
    console.log('merchantSchema.methods.quote error: ', error)
    return Promise.reject(error)
  }
}

// ? Old

merchantSchema.methods.updateQuotation = async function(newQuotation) {
  const { currency, buy, sell } = newQuotation
  if (!currency || (!buy && !sell)) return Promise.reject('args: missing')

  const { quotations } = this
  if (!quotations) return Promise.reject('merchant: no quotations at all')

  const curQuotation = quotations
    .filter(item => item.currency === currency)
    .pop()

  if (!curQuotation)
    return Promise.reject(`merchant: No quotations for currency ${currency}`)

  if (buy) curQuotation.buy = buy
  if (sell) curQuotation.sell = sell

  await this.save()

  return Promise.resolve(curQuotation)
}

// static methods
merchantSchema.statics.deliver = function() {
  return this.find({ delivery: true })
}

// query is chained according to args, hence no 'exec' or 'await'
merchantSchema.statics.search = async function({
  product: { base, quote },
  amount,
  service: { delivery },
  area: { lat, lng, distance },
  pagination: { sortKey, sortOrder, after, count },
}) {
  let query = after ? this.find({ _id: { $gt: after } }) : this.find()

  query = query.where({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: distance * 1000,
      },
    },
  })

  // 'if (delivery)' alone could either mean: don't care, or alternatively: look for those that do not support delivery
  if (specified(delivery)) query = query.where({ delivery })

  if (specified(count)) query = query.limit(count)

  query = query.sort({ [sortKey]: sortOrder })

  return query
}

merchantSchema.statics.lastKey = async function(sortKey, sortOrder) {
  const order = sortOrder === 'ascending' ? 'descending' : 'ascending'
  const lastRec = await this.find()
    .sort({ [sortKey]: order })
    .limit(1)
  return lastRec.pop()[sortKey]
}

// query helpers
merchantSchema.query.charging = function() {
  return this.where('delivery_charge').ne(null)
}

merchantSchema.query.selling = function(currency) {
  return this.where({ 'quotations.currency': currency })
}

export default mongoose.model('Merchant', merchantSchema)
