import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.text('meal').primary()
    table.text('description')
    table.boolean('on_diet')
    table.timestamp('consumed_at')
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable()
    table.text('user_id').references('id').inTable('users')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
