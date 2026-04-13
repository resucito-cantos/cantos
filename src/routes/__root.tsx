import type { QueryClient } from "@tanstack/react-query";
import {
	Outlet,
	createRootRouteWithContext,
	HeadContent,
	Scripts,
	useMatches,
} from "@tanstack/react-router";
import { allCantos } from "content-collections";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { CommandPaletteDialog } from "../components/CommandPalette";
import {
	ChordsVisibleContext,
	loadSettings,
	saveSettings,
} from "../hooks/useChordsVisible";
import type { CantoEntry } from "../hooks/useSearch";
import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Resucitó" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	shellComponent: RootDocument,
	component: RootComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<head>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-white text-gray-800 antialiased">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	const [paletteOpen, setPaletteOpen] = useState(false);
	const [chordsVisible, setChordsVisible] = useState(() => loadSettings().chordsVisible);
	const cantos = allCantos as CantoEntry[];
	const matches = useMatches();
	const isHomePage = matches[matches.length - 1]?.fullPath === "/";

	const toggleChords = useCallback(() => {
		setChordsVisible((v) => {
			const next = !v;
			saveSettings({ chordsVisible: next });
			return next;
		});
	}, []);

	const handleKeyDown = useCallback((e: KeyboardEvent) => {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			setPaletteOpen(true);
		}
	}, []);

	useEffect(() => {
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [handleKeyDown]);

	useEffect(() => {
		if ("serviceWorker" in navigator) {
			navigator.serviceWorker.register("/sw.js");
		}
	}, []);

	return (
		<ChordsVisibleContext value={{ chordsVisible, toggleChords }}>
			{!isHomePage && (
				<button
					type="button"
					onClick={() => setPaletteOpen(true)}
					className="fixed top-4 right-4 z-40 flex size-10 items-center justify-center rounded-lg bg-white shadow-md outline-1 outline-black/5 transition hover:bg-gray-50"
					aria-label="Buscar cantos"
				>
					<Bars3Icon className="size-5 text-gray-600" />
				</button>
			)}

			<CommandPaletteDialog
				cantos={cantos}
				open={paletteOpen}
				onClose={() => setPaletteOpen(false)}
			/>

			<Outlet />
		</ChordsVisibleContext>
	);
}
