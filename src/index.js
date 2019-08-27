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

import connect from './connections/mlab'
import test from './tests/merchant'
import { startPolling } from './models/trading'

console.log('graphql/index.js:')
console.log('process.env.ENV_FILE:', process.env.ENV_FILE)

const {
  REACT_APP_SERVER,
  REACT_APP_SSR,
  NOSERVER_NOSSR_PORT,
  SERVER_SSR_PORT,
  SERVER_NOSSR_PORT,
} = process.env

// heroku doesnt allow port number to be assigned, providing a dynamic environment variable instead ($PORT)
const port =
  process.env.PORT ||
  (JSON.parse(REACT_APP_SERVER)
    ? JSON.parse(REACT_APP_SSR)
      ? SERVER_SSR_PORT
      : SERVER_NOSSR_PORT
    : NOSERVER_NOSSR_PORT)

console.log('graphql server port: ', port)

connect().catch(error => console.error('🤢 mongoDB connection error:', error))

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
      // console.log(connection.context)
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
    console.log('in formatError')
    console.log('error: ', error)
    console.log(error.message)
    return error
  },

  formatResponse: response => {
    return response
  },
})

server.listen({ port }).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

// test()
// startPolling({ coins: ['BTC', 'ETH'], currencies: ['USD', 'EUR'], int: 1000 })
