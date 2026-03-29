export default function Loading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#e8590c]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
      </div>
    </div>
  );
}
