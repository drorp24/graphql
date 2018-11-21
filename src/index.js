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
  context: { mmodels },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

test()
