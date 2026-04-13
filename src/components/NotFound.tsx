import { Link } from "@tanstack/react-router";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";

export function NotFound() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
			<p className="text-6xl font-bold text-red-600">404</p>
			<p className="mt-4 text-lg text-gray-600">
				No se encontró lo que estabas buscando,
			</p>
			<p className="text-lg text-gray-600">pero puedes escuchar este:</p>

			<Link
				to="/cantos/$slug"
				params={{ slug: "no-esta-aqui-resucito" }}
				className="mt-8 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-md no-underline transition hover:-translate-y-0.5 hover:shadow-lg"
			>
				<div className="flex size-12 flex-none items-center justify-center rounded-lg bg-red-500">
					<MusicalNoteIcon className="size-6 text-white" />
				</div>
				<div className="text-left">
					<p className="m-0 text-base font-semibold text-gray-900">
						No está aquí, resucitó
					</p>
					<p className="m-0 text-sm text-gray-500">Mateo 28,1-8</p>
				</div>
			</Link>
		</main>
	);
}
