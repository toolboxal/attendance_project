"use client";
import { useForm } from "@tanstack/react-form";
import { Link, useRouter } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "#/components/ui/button";
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "#/components/ui/input-otp";
import { authClient } from "#/lib/auth-client";
import { cn } from "#/lib/utils";

export function LoginForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const router = useRouter();
	const [step, setStep] = useState<"email" | "otp">("email");
	const [authError, setAuthError] = useState<string | null>(null);
	const [timeLeft, setTimeLeft] = useState(120);
	const [isResending, setIsResending] = useState(false);
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const startTimer = useCallback(() => {
		setTimeLeft(120);
		if (timerRef.current) clearInterval(timerRef.current);
		const id = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(id);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);
		timerRef.current = id;
	}, []);

	useEffect(() => {
		if (step === "otp") startTimer();
		return () => {
			if (timerRef.current) clearInterval(timerRef.current);
		};
	}, [step, startTimer]);

	const formatTime = (seconds: number) => {
		const m = Math.floor(seconds / 60)
			.toString()
			.padStart(2, "0");
		const s = (seconds % 60).toString().padStart(2, "0");
		return `${m}:${s}`;
	};

	const handleResend = async () => {
		setIsResending(true);
		setAuthError(null);
		const { error } = await authClient.emailOtp.sendVerificationOtp({
			email: form.state.values.email,
			type: "sign-in",
		});
		if (error) {
			setAuthError(error.message || "Failed to resend OTP");
		} else {
			startTimer();
			toast("OTP resent to your email address.");
		}
		setIsResending(false);
	};

	const form = useForm({
		defaultValues: {
			email: "",
			otp: "",
		},
		onSubmit: async ({ value }) => {
			setAuthError(null);
			const email = value.email.trim().toLowerCase();
			if (step === "email") {
				// Step 1: Request OTP
				const { error } = await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "sign-in", // Works for both login and signup
				});
				if (error) {
					setAuthError(error.message || "An unknown error occurred");
				} else {
					setStep("otp");
				}
			} else {
				// Step 2: Verify OTP
				const { error } = await authClient.signIn.emailOtp({
					email,
					otp: value.otp,
				});
				if (error) {
					setAuthError(error.message || "An unknown error occurred");
				} else {
					// Redirect to protected dashboard on success
					router.navigate({ to: "/app/dashboard" });
					toast.success("Successfully logged in.");
				}
			}
		},
	});

	return (
		<div className={cn("flex flex-col gap-6 w-lg", className)} {...props}>
			<form
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<FieldGroup>
					{step === "email" ? (
						<div className="flex flex-col items-center gap-2 text-center">
							<h1 className="text-xl font-bold">Login to your account</h1>
							<FieldDescription>
								Don&apos;t have an account? <Link to="/signup">Sign up</Link>
							</FieldDescription>
						</div>
					) : (
						<div className="flex flex-col items-left gap-2">
							<h1 className="text-xl font-bold">Verify your login</h1>
							<FieldDescription>
								Enter the verification code we sent to your email address:
								<span className="font-bold">{form.state.values.email}</span>
							</FieldDescription>
						</div>
					)}

					{step === "email" ? (
						<form.Field
							name="email"
							validators={{
								onSubmit: z.email("Please enter a valid email address"),
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="email">Email</FieldLabel>
									<Input
										id="email"
										type="email"
										placeholder="hello@email.com"
										className="px-3 py-6 text-lg"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 ? (
										<FieldDescription className="text-red-500">
											<em>
												{field.state.meta.errors
													.map((err: any) =>
														typeof err === "string"
															? err
															: err?.message ||
																err?.issue?.message ||
																"Invalid input",
													)
													.join(", ")}
											</em>
										</FieldDescription>
									) : (
										<FieldDescription>
											An OTP will be sent to your email address.
										</FieldDescription>
									)}
								</Field>
							)}
						</form.Field>
					) : (
						<form.Field
							name="otp"
							validators={{
								onSubmit: z.string().length(6, "OTP must be 6 digits"),
							}}
						>
							{(field) => (
								<Field>
									<FieldLabel htmlFor="otp">Verification Code</FieldLabel>
									<InputOTP
										maxLength={6}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(value) => field.handleChange(value)}
									>
										<InputOTPGroup>
											<InputOTPSlot
												index={0}
												className="size-14 text-2xl border-zinc-500"
											/>
											<InputOTPSlot
												index={1}
												className="size-14 text-2xl border-zinc-500"
											/>
											<InputOTPSlot
												index={2}
												className="size-14 text-2xl border-zinc-500"
											/>
											<InputOTPSlot
												index={3}
												className="size-14 text-2xl border-zinc-500"
											/>
											<InputOTPSlot
												index={4}
												className="size-14 text-2xl border-zinc-500"
											/>
											<InputOTPSlot
												index={5}
												className="size-14 text-2xl border-zinc-500"
											/>
										</InputOTPGroup>
									</InputOTP>
									{field.state.meta.errors.length > 0 ? (
										<FieldDescription className="text-red-500">
											<em>
												{field.state.meta.errors
													.map((err: any) =>
														typeof err === "string"
															? err
															: err?.message ||
																err?.issue?.message ||
																"Invalid input",
													)
													.join(", ")}
											</em>
										</FieldDescription>
									) : null}
									<div className="flex items-center justify-between mt-1">
										<FieldDescription>
											{timeLeft > 0 ? (
												<>
													Code expires in{" "}
													<span
														className={cn(
															"font-mono font-semibold",
															timeLeft <= 30
																? "text-red-500"
																: "text-foreground",
														)}
													>
														{formatTime(timeLeft)}
													</span>
												</>
											) : (
												<span className="text-red-500">Code expired.</span>
											)}
										</FieldDescription>
										<button
											type="button"
											onClick={handleResend}
											disabled={isResending || timeLeft > 60}
											className="text-sm underline underline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed hover:text-foreground transition-colors"
										>
											{isResending ? "Sending..." : "Resend code"}
										</button>
									</div>
								</Field>
							)}
						</form.Field>
					)}

					<Field>
						{authError && (
							<div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md mb-2">
								{authError}
							</div>
						)}
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button type="submit" size={"xl"} disabled={!canSubmit}>
									{isSubmitting
										? "Please wait..."
										: step === "email"
											? "Continue with Email"
											: "Verify OTP"}
								</Button>
							)}
						</form.Subscribe>
					</Field>

					{step === "email" && (
						<>
							<FieldSeparator className="**:data-[slot=field-separator-content]:bg-zinc-900">
								Or
							</FieldSeparator>
							<Field>
								<Button variant="outline" type="button" size={"xl"}>
									<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
										<title>Google logo</title>
										<path
											d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
											fill="currentColor"
										/>
									</svg>
									Continue with Google
								</Button>
							</Field>
						</>
					)}
				</FieldGroup>
			</form>
		</div>
	);
}
