import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { ApolloServer } from 'apollo-server'

import schema from './schema'
import resolvers from './resolvers'
import models from './models'

const app = express()

app.use(cors())

const server = new ApolloServer({
  typeDefs: schema,
  resolvers,
  context: { models },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
