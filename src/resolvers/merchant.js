// Enables changing the structure of the args objects exposed to the client w/o
// having to change the model's methods
import pubsub from '../subscriptions/pubsub'
import { QUOTATION_UPDATED } from '../subscriptions/events'
// import { UserInputError } from 'apollo-server'
// import { anyIsMissingFrom } from './utility'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { UserInputError } from 'apollo-server'

// (bad) example demonstrating how to validate and propagate validation errors to the client
const validateMerchantsArgs = args => {
  const validationErrors = {}
  const { lat, lng } = args
  if (!lat || !lng) {
    validationErrors.location = 'Missing'
  }
  return validationErrors
}

// for fetchPaginated to stay generic:
// - every query using it should have a 'pagination: { sortKey, sortOrder }'
// - every model implementation (e.g. 'Merchant') should have a 'lastKey' method
const fetchPaginated = async (model, method, args) => {
  const {
    pagination: { sortKey, sortOrder },
  } = args
  let [cursor, hasMore] = [null, false]

  const records = await model[method](args)

  if (records.length) {
    const last = records[records.length - 1]
    cursor = last[sortKey]
    const lastKey = await model.lastKey(sortKey, sortOrder)
    hasMore = cursor !== lastKey
  } else {
    cursor = ''
    hasMore = false
  }

  return [records, cursor, hasMore]
}

export default {
  Subscription: {
    quotationUpdated: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([QUOTATION_UPDATED]),
    },
  },

  Query: {
    merchants: async (_, args, { mmodels: { Merchant } }) => {
      // Validation
      const validationErrors = validateMerchantsArgs(args)
      if (validationErrors.length > 0) {
        throw new UserInputError('Bad args', { validationErrors })
      }

      // Pagination
      const [records, cursor, hasMore] = await fetchPaginated(
        Merchant,
        'search',
        args,
      )

      return {
        records,
        cursor,
        hasMore,
      }
    },
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
