import { Link } from "@tanstack/react-router";
import type { CantoEntry } from "../hooks/useSearch";

type SearchBarProps = {
	query: string;
	onQueryChange: (query: string) => void;
	results: CantoEntry[];
};

export function SearchBar({ query, onQueryChange, results }: SearchBarProps) {
	return (
		<div className="relative w-full max-w-xl">
			<input
				type="text"
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				placeholder="Buscar cantos..."
				className="w-full rounded-full border border-gray-300 px-6 py-3 text-base shadow-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
				autoFocus
			/>

			{results.length > 0 && (
				<ul className="absolute left-0 right-0 top-full z-10 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-lg">
					{results.map((canto) => (
						<li key={canto.slug}>
							<Link
								to="/cantos/$slug"
								params={{ slug: canto.slug }}
								className="flex items-center gap-3 px-6 py-3 no-underline transition hover:bg-gray-50"
							>
								<div>
									<p className="m-0 font-semibold text-gray-900">
										{canto.title}
									</p>
									{canto.subtitle && (
										<p className="m-0 text-sm text-gray-500">
											{canto.subtitle}
										</p>
									)}
								</div>
								{canto.category && canto.category !== "TODO" && (
									<span className="ml-auto rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
										{canto.category}
									</span>
								)}
							</Link>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
