// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      user: string
      created_at: string
    }
    meals: {
      id: string
      meal: string
      description?: string
      on_diet: boolean
      consumed_at: string
      created_at: string
      user_id: string
    }
  }
}
