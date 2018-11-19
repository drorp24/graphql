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
}
