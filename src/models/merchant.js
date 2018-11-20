import mongoose from 'mongoose'

const quotationSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  currency: { type: String, required: true },
  buy: Number,
  sell: Number,
})

const pointSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  type: { type: String, required: true, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true },
})

const merchantSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  place_id: String,
  name: { type: String, required: true },
  name_he: String,
  address: String,
  address_he: String,
  email: String,
  phone: String,
  delivery: Boolean,
  delivery_charge: Number,
  currency: { type: String, required: true },
  location: { type: pointSchema, required: true },
  quotations: [quotationSchema],
})

// virtual
merchantSchema.virtual('delivers').get(function() {
  return this.delivery
})

// instance method
merchantSchema.methods.rate = function(currency) {
  //this.quotations.filter(item => item.currency === 'USD')[0].buy
  const { quotations, name } = this

  if (!quotations) return console.log(`${name} has no quotations`)
  const rate_record = quotations.filter(item => item.currency === currency)
  if (!rate_record[0])
    return console.log(`No rate defined for currency ${currency}`)

  return rate_record[0]
}

// static methods
merchantSchema.statics.deliver = function() {
  return this.find({ delivery: true }, 'delivery_charge')
}

merchantSchema.statics.findNearest = function(args) {
  const { lat, lng, maxDistance, maxResults } = args

  let query = this.find({
    location: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistance * 1000,
      },
    },
  })

  if (maxResults) query = query.limit(maxResults)

  return query
}

// query helpers
merchantSchema.query.charging = function() {
  return this.where('delivery_charge').ne(null)
}

export default mongoose.model('Merchant', merchantSchema)
