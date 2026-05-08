import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/live')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/live"!</div>
}
