import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'

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

server.applyMiddleware({ app, path: '/graphql' })

app.listen({ port: 8001 }, () => {
  console.log('Apollo Server on http://localhost:8001/graphql')
})
