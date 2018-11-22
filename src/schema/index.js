// graphql-tools's mergeSchemas fails with "Can't find type String"
// no stackoverflow or any other word about this. Hopeless.
import { gql } from 'apollo-server'

export default gql`
  type Query {
    merchants(
      searchArea: SearchArea!
      merchantServices: MerchantServices!
      searchResults: SearchResults!
    ): [Merchant!]
    merchantsByName(name: String!, searchResults: SearchResults!): [Merchant!]
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

  input SearchArea {
    "Search area center latitude"
    lat: Float!
    "Search area center longitude"
    lng: Float!
    "Search area maximum radius"
    distance: Float!
  }

  input MerchantServices {
    "Supports delivery"
    delivery: Boolean
    "Sells currency"
    currency: String
  }

  input SearchResults {
    "Maximum results to fetch"
    results: Float
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
