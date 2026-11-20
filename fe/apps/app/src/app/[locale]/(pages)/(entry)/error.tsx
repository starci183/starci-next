"use client"

import { AppErrorPage } from "@/features/pages/AppErrorPage"

type ErrorProps = { readonly reset: () => void }

/** This route group's error boundary slot: it mounts the shared error page and hands it the retry. */
const ErrorBoundary = (props: ErrorProps) => <AppErrorPage onRetry={props.reset} />

export default ErrorBoundary
