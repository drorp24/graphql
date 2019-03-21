// Enables changing the structure of the args objects exposed to the client w/o
// having to change the model's methods
import { flatten } from './utility'
import pubsub from '../subscriptions/pubsub'
import { QUOTATION_UPDATED } from '../subscriptions/events'
// import { UserInputError } from 'apollo-server'
// import { anyIsMissingFrom } from './utility'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { UserInputError } from 'apollo-server'

export default {
  Subscription: {
    quotationUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([QUOTATION_UPDATED]),
    },
  },
  Query: {
    merchants: (parent, args, { mmodels }) => {
      // Input / authentication / etc should be checked / thrown here rather than in the (mongoose) implementation
      // This allows to output a custom error, but won't interfere with succesful resolvers to reach clients (or so documentation promises)
      const { lat, lng } = args
      const validationErrors = {}
      if (!lat || !lng) {
        // validationErrors.location = 'Missing'
      }
      if (Object.keys(validationErrors).length > 0) {
        throw new UserInputError('No location provided', { validationErrors })
      }
      return mmodels.Merchant.search(flatten(args))
    },
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

  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value) // value from the client
    },
    serialize(value) {
      // return value.getTime() // value sent to the client
      return new Date(value)
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return new Date(ast.value) // ast value is always in string format
      }
      return null
    },
  }),
}
