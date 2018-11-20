import 'dotenv/config'
import { ApolloServer } from 'apollo-server'

import schema from './schema'
import resolvers from './resolvers'
import models from './models'
import Merchant from './models/merchant'

import connect from './mongoDB/connect'
import test from './tests/merchant'

connect().catch(error =>
  console.error('🤢 mongoDB connection error:', error.errmsg),
)

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: { models, Merchant },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})

test()
