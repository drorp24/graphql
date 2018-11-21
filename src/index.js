import 'dotenv/config'
import { ApolloServer } from 'apollo-server'

import schema from './schema/merchant'
import resolvers from './resolvers/merchant'
import models from './models'
import Merchant from './models/merchant'

import connect from './mongoDB/connect'
import test from './tests/merchant'

connect().catch(error =>
  console.error('🤢 mongoDB connection error:', error.errmsg),
)

// will be merged into models, so every <model> is accessible as models.<model>
const mmodels = { Merchant }
const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
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
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

test()
