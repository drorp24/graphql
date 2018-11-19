import 'dotenv/config'
import { ApolloServer } from 'apollo-server'

import schema from './schema'
import resolvers from './resolvers'
import models from './models'

import connect from './mongoDB/connect'
connect().catch(error =>
  console.error('🤢 mongoDB connection error:', error.errmsg),
)

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: { models },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
