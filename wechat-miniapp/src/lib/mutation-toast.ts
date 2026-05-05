import { toastError, toastSuccess } from './toast'

type ToastMessages = {
  success?: string
  failure?: string
}

type MutationLike<TVariables, TResult> = {
  mutateAsync: (variables: TVariables) => Promise<TResult>
}

export type MutationOutcome<TResult> =
  | { ok: true; result: TResult }
  | { ok: false; error: unknown }

/**
 * Run a TanStack-style mutation and toast on success/failure. Replaces the
 * boilerplate
 *
 *   try { await m.mutateAsync(args); toastSuccess(s) } catch { toastError(f) }
 *
 * with a single call that returns a discriminated outcome — callers branch on
 * `outcome.ok` instead of inspecting the result, so void mutations like delete
 * behave the same as ones that return data.
 */
export async function runMutationWithToast<TVariables, TResult>(
  mutation: MutationLike<TVariables, TResult>,
  variables: TVariables,
  messages: ToastMessages
): Promise<MutationOutcome<TResult>> {
  try {
    const result = await mutation.mutateAsync(variables)
    if (messages.success) toastSuccess(messages.success)
    return { ok: true, result }
  } catch (error) {
    if (messages.failure) toastError(messages.failure)
    return { ok: false, error }
  }
}
