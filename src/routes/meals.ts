import { FastifyInstance } from 'fastify'
import crypto from 'node:crypto'
import { z } from 'zod'
import { knex } from '../database'

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      meal: z.string(),
      description: z.string(),
      onDiet: z.boolean(),
      consumedAt: z.string(),
      userId: z.string(),
    })

    const { meal, description, onDiet, consumedAt, userId } =
      createMealBodySchema.parse(request.body)

    const createdMeal = await knex('meals')
      .insert({
        meal,
        description,
        on_diet: onDiet,
        consumed_at: consumedAt,
        user_id: userId,
        id: crypto.randomUUID(),
      })
      .returning('*')

    return reply.status(201).send(`Meal ${createdMeal[0].meal} created`)
  })

  app.get('/', async (request) => {
    const getMealHeaderSchema = z.object({
      userid: z.string(),
    })

    const getMealQuerySchema = z.object({
      mealid: z.optional(z.string()),
    })

    const { userid } = getMealHeaderSchema.parse(request.headers)

    const { mealid } = getMealQuerySchema.parse(request.query)

    if (!userid) {
      throw new Error('Please, inform an user id')
    }

    if (mealid) {
      const meals = await knex('meals')
        .select()
        .where('user_id', userid)
        .where('id', mealid)

      if (!meals) {
        throw new Error('Meal not found')
      }

      return {
        meals,
      }
    } else {
      const meals = await knex('meals').select().where('user_id', userid)

      return {
        meals,
      }
    }
  })

  app.get('/summary', async (request) => {
    const getMealHeaderSchema = z.object({
      userid: z.string(),
    })
    const { userid } = getMealHeaderSchema.parse(request.headers)

    if (!userid) {
      throw new Error('Please, inform an user id')
    }

    const totalMeals = await knex('meals')
      .where('user_id', userid)
      .count('', { as: 'Total Meals:' })

    const dietMeals = await knex('meals')
      .where('user_id', userid)
      .where('on_diet', true)
      .count('', { as: 'Meals on diet:' })

    const notDietMeals = await knex('meals')
      .where('user_id', userid)
      .where('on_diet', false)
      .count('', { as: 'Meals not on diet:' })

    const sequence = await knex('meals')
      .where('user_id', userid)
      .orderBy('consumed_at', 'asc')

    let currentSequence = 0
    let maxSequence = 0

    // Percorra as refeições
    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i].on_diet) {
        // Se a refeição estiver na dieta, incremente a sequência atual
        currentSequence++
      } else {
        // Se a refeição não estiver na dieta, verifique se a sequência atual é maior que a máxima
        maxSequence = Math.max(maxSequence, currentSequence)
        // Reinicie a sequência atual
        currentSequence = 0
      }
    }

    maxSequence = Math.max(maxSequence, currentSequence)

    const summary = {
      'Total Meals': totalMeals[0]['Total Meals:'],
      'Meals on diet': dietMeals[0]['Meals on diet:'],
      'Meals not on diet': notDietMeals[0]['Meals not on diet:'],
      'Max Sequence': maxSequence,
    }

    return summary
  })

  app.put('/', async (request, reply) => {
    const updateMealBodySchema = z.object({
      id: z.string(),
      meal: z.string(),
      description: z.string(),
      onDiet: z.boolean(),
      consumedAt: z.string(),
    })

    const { id, meal, description, onDiet, consumedAt } =
      updateMealBodySchema.parse(request.body)

    const existentMeal = await knex('meals').where('id', id).first()

    if (!existentMeal) {
      throw new Error('Meal not found')
    }

    const updatedMeal = await knex('meals')
      .update({
        meal: meal != null ? meal : existentMeal.meal,
        description:
          description != null ? description : existentMeal.description,
        on_diet: onDiet != null ? onDiet : existentMeal.on_diet,
        consumed_at: consumedAt != null ? consumedAt : existentMeal.consumed_at,
      })
      .where('id', id)
      .returning('*')

    return reply.status(201).send(`Meal ${updatedMeal[0].meal} updated`)
  })

  app.delete('/', async (request, reply) => {
    const deleteMealBodySchema = z.object({
      id: z.string(),
    })

    const getMealHeaderSchema = z.object({
      userid: z.string(),
    })

    const { userid } = getMealHeaderSchema.parse(request.headers)

    if (!userid) {
      throw new Error('Please, inform an user id')
    }

    const { id } = deleteMealBodySchema.parse(request.body)

    const existentMeal = await knex('meals')
      .where('id', id)
      .where('user_id', userid)
      .first()

    if (!existentMeal) {
      throw new Error('Meal not found')
    }

    await knex('meals').where('id', id).delete()

    return reply.status(201).send(`Meal deleted`)
  })
}
