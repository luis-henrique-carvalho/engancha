import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { SimulationTestForm } from './simulation-test-form'

describe('SimulationTestForm', () => {
  const mockContent = {
    id: 'content-1',
    externalId: 'ext-post-1',
    title: 'Lançamento do nosso novo produto!',
    type: 'POST' as const,
    thumbnailUrl: 'https://images.unsplash.com/photo-test.jpg',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders target content preview and form inputs', async () => {
    const { getByTestId, getByText } = await render(
      <SimulationTestForm
        content={mockContent}
        onSubmit={vi.fn()}
      />,
    )

    await expect.element(getByTestId('simulation-target-content')).toBeInTheDocument()
    await expect.element(getByText('Lançamento do nosso novo produto!')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-input-author')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-input-comment-id')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-input-text')).toBeInTheDocument()
    await expect.element(getByTestId('simulation-submit-btn')).toBeInTheDocument()
  })

  it('validates required fields on submit without calling onSubmit when empty', async () => {
    const onSubmit = vi.fn()
    const { getByTestId } = await render(
      <SimulationTestForm
        content={mockContent}
        onSubmit={onSubmit}
      />,
    )

    const textInput = getByTestId('simulation-input-text')
    await textInput.fill('')

    const submitBtn = getByTestId('simulation-submit-btn')
    await submitBtn.click()

    expect(onSubmit).not.toHaveBeenCalled()
    await expect.element(getByTestId('simulation-form-error')).toBeInTheDocument()
  })

  it('calls onSubmit with entered values when valid', async () => {
    const onSubmit = vi.fn()
    const { getByTestId } = await render(
      <SimulationTestForm
        content={mockContent}
        onSubmit={onSubmit}
      />,
    )

    const authorInput = getByTestId('simulation-input-author')
    await authorInput.fill('@cliente.novo')

    const textInput = getByTestId('simulation-input-text')
    await textInput.fill('EU QUERO')

    const submitBtn = getByTestId('simulation-submit-btn')
    await submitBtn.click()

    expect(onSubmit).toHaveBeenCalledWith({
      author: '@cliente.novo',
      text: 'EU QUERO',
      commentId: undefined,
    })
  })
})
