import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { EventsTabPreview } from "#/components/public/landing/EventsTabPreview";
import { Button } from "#/components/ui/button";

export function HeroSection() {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(true);
	}, []);

	return (
		<section className="relative flex flex-col py-20 md:py-28">
			<div className="landing-glow pointer-events-none absolute inset-0 -z-10" />
			<div className="spine">
				<motion.div
					className="text-left opacity-0"
					initial={{ opacity: 0, y: 16 }}
					animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
					transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
				>
					<h1 className="text-5xl md:text-7xl font-heading text-white tracking-tight leading-[1.05]">
						Orchestrate guest flow on the live floor.
					</h1>
					<p className="text-md md:text-lg text-zinc-400 pt-6 max-w-xl font-light leading-relaxed">
						Replace noisy group chats with structured coordination. Asistir
						helps up to 50 staff direct attendees to the right place — in real
						time.
					</p>
					<div className="flex flex-wrap items-center justify-start gap-3 pt-8">
						<Button
							size="sm"
							className="md:h-12 md:gap-2 md:px-2.5 md:text-lg"
							asChild
						>
							<Link to="/signup" search={{ checkoutSlug: undefined }}>
								Get started free
							</Link>
						</Button>
						<Button
							size="sm"
							variant="ghost"
							className="md:h-12 md:gap-2 md:px-2.5 md:text-lg"
							asChild
						>
							<Link to="/signin">Sign in</Link>
						</Button>
					</div>
				</motion.div>
			</div>
			<EventsTabPreview />
		</section>
	);
}
