import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import crypto from 'node:crypto'

export async function userRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createUserBodySchema = z.object({
      user: z.string(),
    })

    const { user } = createUserBodySchema.parse(request.body)

    const checkUserExists = await knex('users')
      .where({
        user,
      })
      .first()

    console.log(checkUserExists)

    if (checkUserExists) {
      return reply.status(409).send('User already exists')
    }

    const createdUser = await knex('users')
      .insert({
        id: crypto.randomUUID(),
        user,
      })
      .returning('user')

    return reply.status(201).send(`User ${createdUser[0].user} created`)
  })

  app.get('/', async () => {
    const users = await knex('users').select()

    return {
      users,
    }
  })
}
