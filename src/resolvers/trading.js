import pubsub from '../subscriptions/pubsub'
import { TRADING_UPDATED } from '../subscriptions/events'
import Trading from '../models/trading'

export default {
  Subscription: {
    tradingUpdated: {
      subscribe: () => pubsub.asyncIterator([TRADING_UPDATED]),
    },
  },
  Query: {
    trading: (parent, args) => {
      const current = Trading.current(args)
      // pubsub.publish(TRADING_UPDATED, { tradingUpdated: current })
      return current
    },
  },
}
