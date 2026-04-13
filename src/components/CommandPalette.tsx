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
	EyeIcon,
	EyeSlashIcon,
	MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "@tanstack/react-router";
import { useChordsVisible } from "../hooks/useChordsVisible";
import { useSearch, type SearchResult } from "../hooks/useSearch";

const CATEGORY_COLORS: Record<string, string> = {
	precatecumenado: "bg-white outline outline-1 outline-gray-300",
	catecumenado: "bg-[#cdedf5]",
	"elección": "bg-[#d5f0d5]",
	"litúrgico": "bg-[#fef9c3]",
};

type ActionItem = {
	id: string;
	name: string;
	icon: React.ComponentType<{ className?: string }>;
	action: () => void;
};

type PaletteItem = SearchResult | ActionItem;

function isAction(item: PaletteItem): item is ActionItem {
	return "action" in item;
}

function PaletteContent({
	actions,
	onClose,
	floating = false,
}: {
	actions: ActionItem[];
	onClose?: () => void;
	floating?: boolean;
}) {
	const navigate = useNavigate();
	const { query, setQuery, results, isReady } = useSearch();

	const showActions = query === "" && actions.length > 0;

	return (
		<Combobox
			as="div"
			onChange={(item: PaletteItem | null) => {
				if (!item) return;
				if (isAction(item)) {
					item.action();
					onClose?.();
				} else {
					navigate({ to: "/cantos/$slug", params: { slug: item.slug } });
					onClose?.();
				}
			}}
		>
			<div className="grid grid-cols-1">
				<ComboboxInput
					autoFocus
					className="col-start-1 row-start-1 h-12 w-full border-0 bg-transparent pr-4 pl-11 text-base text-gray-900 outline-hidden placeholder:text-gray-400 sm:text-sm"
					placeholder={isReady ? "Buscar cantos..." : "Cargando..."}
					onChange={(e) => setQuery(e.target.value)}
				/>
				<MagnifyingGlassIcon
					className="pointer-events-none col-start-1 row-start-1 ml-4 size-5 self-center text-gray-400"
					aria-hidden="true"
				/>
			</div>

			{(showActions || results.length > 0) && (
				<ComboboxOptions
					static
					className={`max-h-96 transform-gpu scroll-py-3 overflow-y-auto border-t border-gray-100 p-3 ${floating ? "absolute left-0 right-0 top-full z-10 mt-2 rounded-xl bg-white shadow-2xl outline-1 outline-black/5" : ""}`}
				>
					{showActions &&
						actions.map((action) => (
							<ComboboxOption
								key={action.id}
								value={action}
								className="group flex cursor-default rounded-xl p-3 select-none data-focus:bg-gray-100 data-focus:outline-hidden"
							>
								<div className="flex size-10 flex-none items-center justify-center rounded-lg bg-gray-500">
									<action.icon
										className="size-6 text-white"
									/>
								</div>
								<div className="ml-4 flex-auto">
									<p className="text-sm font-medium text-gray-700 group-data-focus:text-gray-900">
										{action.name}
									</p>
								</div>
							</ComboboxOption>
						))}

					{results.map((result) => (
						<ComboboxOption
							key={result.slug}
							value={result}
							className="group flex cursor-default rounded-xl p-3 select-none data-focus:bg-gray-100 data-focus:outline-hidden"
						>
							<div
								className={`flex size-10 flex-none items-center justify-center rounded-lg ${CATEGORY_COLORS[result.category?.toLowerCase() ?? ""] ?? "bg-gray-100"}`}
							>
								<MusicalNoteIcon
									className="size-6 text-gray-500"
									aria-hidden="true"
								/>
							</div>
							<div className="ml-4 flex-auto">
								<p className="text-sm font-medium text-gray-700 group-data-focus:text-gray-900">
									{result.title}
								</p>
								{result.subtitle && (
									<p className="text-sm text-gray-500 group-data-focus:text-gray-700">
										{result.subtitle}
									</p>
								)}
							</div>
						</ComboboxOption>
					))}
				</ComboboxOptions>
			)}

			{query !== "" && results.length === 0 && isReady && (
				<div className={`border-t border-gray-100 px-6 py-14 text-center text-sm sm:px-14 ${floating ? "absolute left-0 right-0 top-full z-10 mt-2 rounded-xl bg-white shadow-2xl outline-1 outline-black/5" : ""}`}>
					<ExclamationCircleIcon
						className="mx-auto size-6 text-gray-400"
						aria-hidden="true"
					/>
					<p className="mt-4 font-semibold text-gray-900">Sin resultados</p>
					<p className="mt-2 text-gray-500">
						No se encontraron cantos para esta busqueda.
					</p>
				</div>
			)}
		</Combobox>
	);
}

type CommandPaletteDialogProps = {
	open: boolean;
	onClose: () => void;
};

export function CommandPaletteDialog({
	open,
	onClose,
}: CommandPaletteDialogProps) {
	const { chordsVisible, toggleChords } = useChordsVisible();

	const actions: ActionItem[] = [
		{
			id: "toggle-chords",
			name: chordsVisible ? "Ocultar diagramas de acordes" : "Mostrar diagramas de acordes",
			icon: chordsVisible ? EyeSlashIcon : EyeIcon,
			action: toggleChords,
		},
	];

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
					<PaletteContent
						actions={actions}
						onClose={onClose}
					/>
				</DialogPanel>
			</div>
		</Dialog>
	);
}

export function CommandPaletteInline() {
	return (
		<div className="relative w-full max-w-xl">
			<div className="overflow-hidden rounded-xl bg-white shadow-2xl outline-1 outline-black/5">
				<PaletteContent actions={[]} floating />
			</div>
		</div>
	);
}
