import mongoose from 'mongoose'

const MLAB_CONNECT = `mongodb://${process.env.DB_USER}:${
  process.env.DB_PASSWORD
}@ds217092.mlab.com:17092/fullproject`

export default async () => {
  await mongoose.connect(
    MLAB_CONNECT,
    { useNewUrlParser: true },
  )
  console.log('🧨  mongoDB successfully connected')

  //Bind connection to error event (to get notification of connection errors)
  mongoose.connection.on(
    'error',
    console.error.bind(console, 'MongoDB connection error:'),
  )
}
