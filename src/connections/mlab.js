import mongoose from 'mongoose'

// The following characters should not be part of the .env variables themselves
// or else they should be escape encoded. That's why such chars are here not there.
// : / ? # [ ] @
const {
  DB_SCHEME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_CLUSTER,
  DB_OPTIONS,
} = process.env
const OPTIONS = DB_OPTIONS ? `?${DB_OPTIONS}` : ''
const MLAB_CONNECT = `${DB_SCHEME}://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_CLUSTER}${OPTIONS}`
console.log('MLAB_CONNECT: ', MLAB_CONNECT)

export default async () => {
  await mongoose.connect(
    MLAB_CONNECT,
    {
      useNewUrlParser: true,
      // sets how many times to try reconnecting
      reconnectTries: 86400,
      // sets the delay between every retry (milliseconds)
      reconnectInterval: 1000,
    },
  )
  console.log('🧨  mongoDB successfully connected')

  //Bind connection to error event (to get notification of connection errors)
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'MongoDB connection error:'),
  )
}
