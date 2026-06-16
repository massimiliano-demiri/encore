export function SectionHeader({ label, color }: { label: string; color?: string }) {
	return (
		<div className="mb-4 flex items-center gap-3">
			<div className={`h-px w-6 ${color ? "bg-" + color + "/40" : "bg-white/10"}`} />
			<span className={`text-xs font-semibold uppercase tracking-[0.2em] ${color ? "text-" + color : "text-white/30"}`}>
				{label}
			</span>
		</div>
	)
}