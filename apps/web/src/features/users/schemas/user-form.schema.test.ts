import { describe, expect, it } from 'vitest'
import { updateUserFormSchema } from './user-form.schema'

describe('user form schemas', () => {
  it('should reject empty update payloads', () => {
    expect(() => updateUserFormSchema.parse({})).toThrow()
  })

  it('should accept partial update payloads with at least one field', () => {
    expect(updateUserFormSchema.parse({ name: 'Ana Maria' })).toEqual({
      name: 'Ana Maria',
    })
  })
})
