// Each of the model methods can respond to its caller in either of 3 ways:
// - returning string result / error (or: Promise.reject/resolve if async) - when called from other methods
// - returning a mongoose query, which is a promise (Apollo will await it to resolve) - when called from resolvers
// - returning a simple obj in the schema declared format, with error or success - if no async query is passed

import mongoose from 'mongoose'
import { currencySchema } from './common'
import { specified } from '../resolvers/utility'

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
merchantSchema.methods.quotation = function({ currency }) {
  const { quotations } = this

  if (!quotations) return Promise.reject('merchant: no quotations at all')
  const quotation = quotations.filter(item => item.currency === currency).pop()
  if (!quotation)
    // a simple error would actually be enough, as there's nothing async in this method
    return Promise.reject(`merchant: No quotations for currency ${currency}`)

  return Promise.resolve(quotation)
}

merchantSchema.methods.quote = async function({ currency, amount }) {
  try {
    const quotation = await this.quotation({ currency })
    const result = quotation.buy * amount
    return result
  } catch (error) {
    return Promise.reject(error)
  }
}

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

merchantSchema.statics.search = function(args) {
  const { lat, lng, distance, delivery, currency, count } = args

  // Not adding 'exec' or 'await' makes 'query' chainable (.selling, .where, .limit)
  let query = this.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: distance * 1000,
      },
    },
  }).selling(currency)

  // if (delivery)' alone could either mean: don't care, or alternatively: look for those that do not support delivery
  if (specified(delivery)) query = query.where({ delivery })

  if (specified(count)) query = query.limit(count)

  return query
}

merchantSchema.statics.byName = function(args) {
  const { name, results } = args
  let query = this.find({ name: new RegExp(name, 'i') })
  if (results) query = query.limit(results)

  return query
}

merchantSchema.statics.updateQuotationByName = async function(args) {
  let { name, quotation } = args
  let merchant = await this.byName({ name: name, results: 1 })
  if (!merchant.length)
    return {
      success: false,
      message: 'merchant: no such name',
      quotation,
    }

  merchant = merchant[0]

  try {
    quotation = await merchant.updateQuotation(quotation)
  } catch (error) {
    return {
      success: false,
      message: error,
      quotation,
    }
  }

  return {
    success: true,
    message: 'ok',
    quotation,
  }
}

// query helpers
merchantSchema.query.charging = function() {
  return this.where('delivery_charge').ne(null)
}

merchantSchema.query.selling = function(currency) {
  return this.where({ 'quotations.currency': currency })
}

export default mongoose.model('Merchant', merchantSchema)
