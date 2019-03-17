// graphql-tools's mergeSchemas fails with "Can't find type String"
// no stackoverflow or any other word about this. Hopeless.
import { gql } from 'apollo-server'

export default gql`
  type Query {
    merchants(
      area: Area!
      currency: String!
      services: Services!
      results: Results
    ): [Merchant!]
    merchantsByName(name: String!, results: Results!): [Merchant!]
    trading(
      "Coins whose prices you want to know"
      coins: [String!]!
      "Prices in the following currencies"
      currencies: [String!]!
    ): Trading!
  }

  type Mutation {
    updateQuotation(
      name: String!
      quotation: QuotationInput!
    ): UpdateQuotationResponse
  }

  type Subscription {
    quotationUpdated: Quotation
    rateUpdated: Quotation
    tradingUpdated: Trading!
  }

  type Merchant {
    id: ID!
    place_id: String
    name: String
    name_he: String
    address: String
    address_he: String
    email: String
    phone: String
    delivery: Boolean
    delivery_charge: Float
    currency: String
    quotations: [Quotation]
    location: Location
    quotation(currency: String!): Quotation
    quote(currency: String!, amount: Float!): Float
  }

  type Quotation {
    id: ID!
    currency: String!
    buy: Float
    sell: Float
  }

  input QuotationInput {
    currency: String!
    buy: Float
    sell: Float
  }

  type Location {
    id: ID!
    type: Point!
    coordinates: [Float!]!
  }

  enum Point {
    Point
  }

  interface MutationResponse {
    success: Boolean!
    message: String!
  }

  type UpdateQuotationResponse implements MutationResponse {
    success: Boolean!
    message: String!
    quotation: Quotation!
  }

  input Area {
    "Search area center latitude"
    lat: Float!
    "Search area center longitude"
    lng: Float!
    "Search area maximum radius"
    distance: Float!
  }

  input Services {
    "Supports delivery"
    delivery: Boolean
  }

  input Results {
    "Maximum results to fetch"
    count: Float
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

  enum Timing {
    CURRENT
  }
`
