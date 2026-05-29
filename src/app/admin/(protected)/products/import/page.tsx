import { ImportClient } from "./ImportClient";

export const metadata = {
  title: "Import Products",
};

export default function AdminImportPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Import Products</h1>
      <p className="text-zinc-400 mb-6">
        Upload a CSV export from your POS (Dutchie, Flowhub, Treez, or
        compatible). Products are matched to existing rows by SKU; missing
        brands and categories are auto-created.
      </p>
      <ImportClient />
    </div>
  );
}
