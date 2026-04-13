import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
	Dialog,
	DialogBackdrop,
	DialogPanel,
} from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import {
	ExclamationCircleIcon,
	MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { filterCantos } from "../hooks/useSearch";
import type { CantoEntry } from "../hooks/useSearch";

const CATEGORY_COLORS: Record<string, string> = {
	precatecumenado: "bg-amber-500",
	catecumenado: "bg-sky-500",
};

function PaletteContent({ cantos }: { cantos: CantoEntry[] }) {
	const [query, setQuery] = useState("");
	const navigate = useNavigate();
	const results = useMemo(() => filterCantos(cantos, query), [cantos, query]);

	return (
		<Combobox
			as="div"
			onChange={(canto: CantoEntry | null) => {
				if (canto) {
					navigate({ to: "/cantos/$slug", params: { slug: canto.slug } });
				}
			}}
		>
			<div className="grid grid-cols-1">
				<ComboboxInput
					autoFocus
					className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pr-4 pl-11 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm"
					placeholder="Buscar cantos..."
					onChange={(e) => setQuery(e.target.value)}
				/>
				<MagnifyingGlassIcon
					className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-gray-400"
					aria-hidden="true"
				/>
			</div>

			{results.length > 0 && (
				<ComboboxOptions
					static
					className="max-h-96 transform-gpu scroll-py-3 overflow-y-auto border-t border-gray-100 p-3"
				>
					{results.map((canto) => (
						<ComboboxOption
							key={canto.slug}
							value={canto}
							className="group flex cursor-default rounded-xl p-3 select-none data-focus:bg-gray-100 data-focus:outline-hidden"
						>
							<div
								className={`flex size-10 flex-none items-center justify-center rounded-lg ${CATEGORY_COLORS[canto.category?.toLowerCase() ?? ""] ?? "bg-red-500"}`}
							>
								<MusicalNoteIcon
									className="size-6 text-white"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-4 flex-auto">
								<p className="text-sm font-medium text-gray-700 group-data-focus:text-gray-900">
									{canto.title}
								</p>
								{canto.subtitle && (
									<p className="text-sm text-gray-500 group-data-focus:text-gray-700">
										{canto.subtitle}
									</p>
								)}
							</div>
							{canto.category && canto.category !== "TODO" && (
								<span className="ml-auto self-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
									{canto.category}
								</span>
							)}
						</ComboboxOption>
					))}
				</ComboboxOptions>
			)}

			{query !== "" && results.length === 0 && (
				<div className="border-t border-gray-100 px-6 py-14 text-center text-sm sm:px-14">
					<ExclamationCircleIcon
						className="mx-auto size-6 text-gray-400"
						aria-hidden="true"
					/>
					<p className="mt-4 font-semibold text-gray-900">
						Sin resultados
					</p>
					<p className="mt-2 text-gray-500">
						No se encontraron cantos para esta busqueda.
					</p>
				</div>
			)}
		</Combobox>
	);
}

type CommandPaletteDialogProps = {
	cantos: CantoEntry[];
	open: boolean;
	onClose: () => void;
};

export function CommandPaletteDialog({
	cantos,
	open,
	onClose,
}: CommandPaletteDialogProps) {
	return (
		<Dialog className="relative z-50" open={open} onClose={onClose}>
			<DialogBackdrop
				transition
				className="fixed inset-0 bg-gray-500/25 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
			/>

			<div className="fixed inset-0 z-50 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
				<DialogPanel
					transition
					className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl outline-1 outline-black/5 transition-all data-closed:scale-95 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
				>
					<PaletteContent cantos={cantos} />
				</DialogPanel>
			</div>
		</Dialog>
	);
}

type CommandPaletteInlineProps = {
	cantos: CantoEntry[];
};

export function CommandPaletteInline({ cantos }: CommandPaletteInlineProps) {
	return (
		<div className="w-full max-w-xl divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl outline-1 outline-black/5">
			<PaletteContent cantos={cantos} />
		</div>
	);
}
