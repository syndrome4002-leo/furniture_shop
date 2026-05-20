export default function Footer({ note }: { note: string }) {
  return (
    <footer className="border-t border-brand-100 mt-24">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-brand-700 flex flex-col md:flex-row justify-between gap-4">
        <p className="max-w-xl">{note}</p>
        <p>&copy; {new Date().getFullYear()} Heirloom Furniture</p>
      </div>
    </footer>
  );
}
