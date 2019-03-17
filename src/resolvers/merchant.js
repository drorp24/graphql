// Enables changing the structure of the args objects exposed to the client w/o
// having to change the model's methods
import { flatten } from './utility'
import pubsub from '../subscriptions/pubsub'
import { QUOTATION_UPDATED } from '../subscriptions/events'
import { UserInputError } from 'apollo-server'
import { anyIsMissingFrom } from './utility'

export default {
  Subscription: {
    quotationUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([QUOTATION_UPDATED]),
    },
  },
  Query: {
    merchants: (parent, args, { mmodels }) =>
      // Input / authentication / etc should be checked / thrown here rather than in the (mongoose) implementation
      // This is an example of throwing a built-in Apollo error
      // Not a good one though, as query structure incl. which arg is mandatory are defined by the query
      // which graphQl checks and returns an array with errors
      //
      // if (anyIsMissingFrom(args, ['currency', 'lat', 'lng'])) {
      // throw new UserInputError('Arguments  invalid', {
      //   invalidArgs: Object.keys(args),
      // })
      // }
      mmodels.Merchant.search(flatten(args)),
    merchantsByName: (parent, args, { mmodels }) =>
      mmodels.Merchant.byName(flatten(args)),
  },
  // Merchant: {
  // GraphQL looks for:
  // - function in the resolver, like the below
  // - instance method in the model (implemented by mongoose)
  // - key in the object model (populated by mongoose with the DB value)
  //
  // quotation: (merchant, { currency }) =>
  //   merchant.quotations.filter(item => item.currency === currency).pop(),
  // },

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
