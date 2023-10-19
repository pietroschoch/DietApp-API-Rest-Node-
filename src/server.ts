import fastify from 'fastify'
import { knex } from './database'

import { env } from './env'
import { userRoutes } from './routes/users'
import { mealsRoutes } from './routes/meals'

const app = fastify()

app.get('/hello', async () => {
  const tables = await knex('sqlite_schema').select('*')

  return tables
})

app.register(userRoutes, {
  prefix: 'users',
})

app.register(mealsRoutes, {
  prefix: 'meals',
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('Server running 💨')
  })
