import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/app/events/$eventId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/app/events/$eventId"!</div>
}
