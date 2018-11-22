import 'dotenv/config'
import { ApolloServer } from 'apollo-server'
import merge from 'lodash.merge'
// import { mergeSchemas } from 'graphql-tools'

// import merchantSchema from './schema/merchant'
// import tradingSchema from './schema/trading'
import manuallyStitchedSchema from './schema/index'
import merchantResolvers from './resolvers/merchant'
import tradingResolvers from './resolvers/trading'
import Merchant from './models/merchant'

import connect from './mongoDB/connect'
import test from './tests/merchant'
import { startPolling } from './models/trading'

connect().catch(error =>
  console.error('🤢 mongoDB connection error:', error.errmsg),
)

// will be merged into models, so every <model> is accessible as models.<model>
const mmodels = { Merchant }
// const unifiedSchema = mergeSchemas({ schemas: [tradingSchema, merchantSchema] })
const unifiedResolvers = merge(merchantResolvers, tradingResolvers)
const server = new ApolloServer({
  typeDefs: manuallyStitchedSchema,

  resolvers: unifiedResolvers,

  context: async ({ req, connection }) => {
    let ctx = { mmodels }

    if (connection) {
      // console.log('\n connection.context: \n')
      // console.log(connection.conext)
      Object.assign(ctx, { connection: connection.context })
    } else {
      // console.log('\n req.headers: \n')
      // console.log(req.headers)
      Object.assign(ctx, { token: req.headers.authorization || '' })
    }

    return ctx
  },

  subscriptions: {
    onConnect: (connectionParams, webSocket, context) => {
      // console.log('connectionParams:')
      // console.log(connectionParams)
    },
  },

  formatError: error => {
    console.log(error)
    return error
  },

  formatResponse: response => {
    console.log(response)
    return response
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

test()
startPolling({ coins: ['BTC', 'ETH'], currencies: ['USD', 'EUR'], int: 3000 })
