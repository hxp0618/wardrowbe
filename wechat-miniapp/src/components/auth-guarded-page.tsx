import type { ReactNode } from 'react'

import { useAuthGuard } from '../hooks/use-auth-guard'

type AuthGuardedPageProps = {
  children: ReactNode
  /**
   * Route to redirect to when the user is unauthenticated. Defaults to the
   * standard miniapp login page; override only when you need to preserve
   * sign-in context (e.g., the invite page passes its token through).
   */
  loginPageUrl?: string
}

/**
 * Drop-in replacement for the
 *   const canRender = useAuthGuard()
 *   if (!canRender) return null
 *   return <PageShell>...</PageShell>
 * pattern. Wraps the page body so the auth gate is visible in JSX rather
 * than tucked away as an early return.
 */
export function AuthGuardedPage(props: AuthGuardedPageProps) {
  const canRender = useAuthGuard(props.loginPageUrl)
  if (!canRender) return null
  return <>{props.children}</>
}
