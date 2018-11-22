import mongoose from 'mongoose'

export const currencySchema = new mongoose.Schema({
  type: { type: String, min: 3, max: 3 },
})
