import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { NotFound } from "../../components/NotFound";

// Keep the heavy editor component out of the production bundle: in non-dev
// builds `import.meta.env.DEV` is statically false and the lazy import is
// dead code.
const SyncEditor = import.meta.env.DEV
	? lazy(() => import("../../components/SyncEditor"))
	: null;

export const Route = createFileRoute("/sync/$slug")({
	staticData: {
		prerender: false,
	},
	component: import.meta.env.DEV ? SyncEditorRoute : NotFound,
	notFoundComponent: NotFound,
});

function SyncEditorRoute() {
	const { slug } = Route.useParams();
	if (!SyncEditor) return null;
	return (
		<Suspense fallback={<div className="p-6 text-gray-500">Loading…</div>}>
			<SyncEditor slug={slug} />
		</Suspense>
	);
}
