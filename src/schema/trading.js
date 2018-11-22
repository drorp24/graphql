import { gql } from 'apollo-server'

export default gql`
  type Query {
    trading(
      "Coins whose prices you want to know"
      coins: [String!]!
      "Prices in the following currencies"
      currencies: [String!]!
    ): Trading!
  }

  type Trading {
    time: Timing!
    trading: [Trade!]!
  }

  type Trade {
    coin: String!
    prices: [Price!]!
  }

  type Price {
    currency: String!
    price: Float
  }

  type Currency {
    "Currency code (3-letter ISO 4217)"
    code: String!
  }

  input CurrencyInput {
    "Currency code (3-letter ISO 4217)"
    code: String!
  }

  type Subscription {
    tradingUpdated: Trading!
  }

  enum Timing {
    CURRENT
  }
`
