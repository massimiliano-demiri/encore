export function Skeleton({ className = "" }: { className?: string }) {
	return <div className={"animate-pulse rounded-md bg-white/10 " + className} />
}

export function PosterGridSkeleton({ count = 6 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{Array.from({ length: count }).map((_, i) => (
				<Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
			))}
		</div>
	)
}