import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
	return (
		<div className="p-8 min-h-dvh bg-zinc-900 text-zinc-50">
			<h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
			<p className="mt-4 text-lg">
				Lorem ipsum dolor sit amet, consectetur adipisicing elit. Natus ducimus
				vel, aut accusamus praesentium aliquam cum molestiae perspiciatis, dicta
				nulla dignissimos eum consequuntur quod, ea iusto eveniet? Sapiente
				distinctio quo eaque provident assumenda ipsa qui mollitia earum
				facilis. Qui, obcaecati.
			</p>
		</div>
	);
}
