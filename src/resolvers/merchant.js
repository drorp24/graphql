// Enables changing the structure of the args objects exposed to the client w/o
// having to change the model's methods
import { flatten } from '../models/utility'

export default {
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
      return mmodels.Merchant.updateQuotationByName({ name, quotation })
    },
  },
}
