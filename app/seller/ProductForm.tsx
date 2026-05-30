"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  createProduct,
  updateProduct,
  type SellerFormState,
} from "./actions";

const CATEGORIES = [
  "Apparel", "Footwear", "Accessories", "Home", "Kitchen", "Outdoors",
  "Electronics", "Beauty", "Toys", "Stationery", "Garden", "Pets",
];

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="btn btn-primary" type="submit" disabled={pending}>
      {pending ? "Saving…" : label}
    </button>
  );
}

export function ProductForm({
  mode,
  product,
}: {
  mode: "create" | "edit";
  product?: {
    id: string;
    title: string;
    description: string;
    category: string;
    priceCents: number;
  };
}) {
  const action = mode === "create" ? createProduct : updateProduct;
  const [state, formAction] = useFormState<SellerFormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} encType="multipart/form-data">
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="field">
        Title
        <input type="text" name="title" defaultValue={product?.title} required />
      </div>
      <div className="field">
        Description
        <textarea name="description" defaultValue={product?.description} required />
      </div>
      <div className="field">
        Category
        <select name="category" defaultValue={product?.category ?? "Apparel"}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        Price (USD)
        <input
          type="number"
          name="price"
          min="0"
          step="0.01"
          defaultValue={product ? (product.priceCents / 100).toFixed(2) : ""}
          required
        />
      </div>
      <div className="field">
        Product image (PNG/JPG){mode === "edit" ? " — leave blank to keep current" : ""}
        <input type="file" name="image" accept="image/png,image/jpeg" />
      </div>
      {state?.error && <p className="form-error">{state.error}</p>}
      <SubmitButton label={mode === "create" ? "Create product" : "Save changes"} />
    </form>
  );
}
