import 'core-js/stable'
import 'regenerator-runtime/runtime'
import 'dotenv/config'

import express from 'express'
import { createServer } from 'http'
import { ApolloServer } from 'apollo-server-express'

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
  GRAPHQL_DOMAIN,
  DEFAULT_GRAPHQL_PORT,
  NOSERVER_NOSSR_PORT,
  SERVER_SSR_PORT,
  SERVER_NOSSR_PORT,
  REACT_APP_GRAPHQL_WEB_SCHEME,
  REACT_APP_GRAPHQL_WEBSOCKET_SCHEME,
} = process.env

console.log(
  'REACT_APP_SERVER, REACT_APP_SSR, GRAPHQL_DOMAIN, DEFAULT_GRAPHQL_PORT, NOSERVER_NOSSR_PORT, SERVER_SSR_PORT, SERVER_NOSSR_PORT, REACT_APP_GRAPHQL_WEB_SCHEME, REACT_APP_GRAPHQL_WEBSOCKET_SCHEME: ',
  REACT_APP_SERVER,
  REACT_APP_SSR,
  GRAPHQL_DOMAIN,
  DEFAULT_GRAPHQL_PORT,
  NOSERVER_NOSSR_PORT,
  SERVER_SSR_PORT,
  SERVER_NOSSR_PORT,
  REACT_APP_GRAPHQL_WEB_SCHEME,
  REACT_APP_GRAPHQL_WEBSOCKET_SCHEME,
)

// in a local environment (only), each of the 3 web servers (CRA's HMR, server with ssr, server with no ssr) is assigned its own different port number.
// That enables running locally a CRA server alongside a production-like server w/o having to kill processes with identical ports.
// Graphql endpoints have to be assigned accordingly as well, to have each web client talk with its own separate graphql server.
// Each of the 3 servers has its own script line in package.json that prefixes the 'build' command with the proper variables/arguments
// The value of these variables are thus embedded by the build and are available thru process.env.
// All this is not possible nor required in heroku.
//
// In a heroku environment, there's only one build command. It is prefixed by no variable assignment.
// While I could define separate scripts for heroku's build as well, it's of no use: heroku will have one server at any given time.
// Furthermore, I would in such case have to pass the value of these variables to the client on a script tag
// if DEFAULT_GRAPHQL_PORT has value, it means we're in a heroku environment and need only assign that value to the port.
// (heroku also doesn't let you assign port numbers to web servers - see comment in index.js and indexNoSsr.js)
const host = GRAPHQL_DOMAIN

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

const app = express()

const apolloServer = new ApolloServer({
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

apolloServer.applyMiddleware({ app })

const httpServer = createServer(app)
apolloServer.installSubscriptionHandlers(httpServer)

httpServer.listen({ /* host,  */ port }, () => {
  console.log(
    `🚀 Server ready at ${REACT_APP_GRAPHQL_WEB_SCHEME}://${host}:${port}${
      apolloServer.graphqlPath
    }`,
  )
  console.log(
    `🚀 Subscriptions ready at ${REACT_APP_GRAPHQL_WEBSOCKET_SCHEME}://${host}:${port}${
      apolloServer.subscriptionsPath
    }`,
  )
})

// test()
// startPolling({ coins: ['BTC', 'ETH'], currencies: ['USD', 'EUR'], int: 1000 })
