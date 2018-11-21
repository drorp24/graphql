// Enables changing the structure of the args objects exposed to the client w/o
// having to change the model's methods
import { flatten } from '../models/utility'
const { PubSub } = require('apollo-server')

const pubsub = new PubSub()
const QUOTATION_UPDATED = 'QUOTATION_UPDATED'

export default {
  Subscription: {
    quotationUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([QUOTATION_UPDATED]),
    },
  },
  Query: {
    merchants: (parent, args, { mmodels }) => {
      return mmodels.Merchant.search(flatten(args))
    },
    merchantsByName: (parent, args, { mmodels }) => {
      return mmodels.Merchant.byName(flatten(args))
    },
  },

  MutationResponse: {
    __resolveType(obj) {
      if (obj.rate) {
        return 'UpdateQuotationResponse'
      }
    },
  },

  Mutation: {
    updateQuotation: (parent, args, { mmodels }) => {
      const { name, quotation } = args
      pubsub.publish(QUOTATION_UPDATED, { quotationUpdated: quotation })
      return mmodels.Merchant.updateQuotationByName({ name, quotation })
    },
  },
}
