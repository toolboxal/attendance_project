import { createFileRoute } from "@tanstack/react-router";
import { DemoFloorApp } from "#/demo/DemoFloorApp";

export const Route = createFileRoute("/demo")({
	component: DemoFloorApp,
});
