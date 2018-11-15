import 'dotenv/config'
import { ApolloServer } from 'apollo-server'

import schema from './schema'
import resolvers from './resolvers'
import models from './models'

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: { models },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
