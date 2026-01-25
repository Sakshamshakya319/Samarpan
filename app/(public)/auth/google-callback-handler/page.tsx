"use client"

import { Suspense } from "react"

function GoogleCallbackHandler() {
  return <div>Test</div>
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleCallbackHandler />
    </Suspense>
  )
}