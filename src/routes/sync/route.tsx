import { createFileRoute, Outlet } from "@tanstack/react-router";
import { NotFound } from "../../components/NotFound";

export const Route = createFileRoute("/sync")({
	staticData: {
		prerender: false,
	},
	component: import.meta.env.DEV ? Outlet : NotFound,
	notFoundComponent: NotFound,
});
