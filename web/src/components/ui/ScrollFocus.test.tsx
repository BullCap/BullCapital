import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScrollFocus from './ScrollFocus'

describe('ScrollFocus', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('reveals an item once when it enters the viewport', () => {
    let observerCallback: IntersectionObserverCallback | undefined
    const disconnect = vi.fn()

    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observerCallback = callback
        }

        disconnect = disconnect
        observe = vi.fn()
        takeRecords = vi.fn()
        unobserve = vi.fn()
      }
    )

    render(
      <ScrollFocus>
        <div>panel</div>
      </ScrollFocus>
    )

    const panel = screen.getByText('panel').parentElement

    expect(panel).toHaveAttribute('data-scroll-focus', 'idle')

    act(() => {
      observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    })

    expect(panel).toHaveAttribute('data-scroll-focus', 'active')
    expect(disconnect).toHaveBeenCalledOnce()
  })
})
