import { useCallback, useEffect, useRef, useState } from 'react'
import type { ConfirmationTone } from '../components/ConfirmationDialog'

export interface ConfirmationOptions {
  title: string
  description: string
  confirmLabel: string
  tone?: ConfirmationTone
}

export function useConfirmationDialog() {
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  const requestConfirmation = useCallback(
    (nextOptions: ConfirmationOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current?.(false)
        resolverRef.current = resolve
        setOptions(nextOptions)
      }),
    [],
  )

  const resolveConfirmation = useCallback((confirmed: boolean) => {
    const resolver = resolverRef.current
    resolverRef.current = null
    setOptions(null)
    resolver?.(confirmed)
  }, [])
  const cancelConfirmation = useCallback(
    () => resolveConfirmation(false),
    [resolveConfirmation],
  )
  const confirm = useCallback(
    () => resolveConfirmation(true),
    [resolveConfirmation],
  )

  useEffect(
    () => () => {
      resolverRef.current?.(false)
      resolverRef.current = null
    },
    [],
  )

  return {
    options,
    requestConfirmation,
    cancelConfirmation,
    confirm,
  }
}
