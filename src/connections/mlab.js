import mongoose from 'mongoose'

const MLAB_CONNECT = `mongodb://${process.env.DB_USER}:${
  process.env.DB_PASSWORD
}@${process.env.DB_URL}`

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
