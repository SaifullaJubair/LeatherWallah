import { createContext } from "react";

// Shares the product-level base price typed in StepOnePrice with the variation
// matrix (StepOneVariationTable) so the per-row "Final = base + delta" cell can
// recompute live without prop-drilling through StepOne → StepOneVariation.
// Default 0 means the table renders fine even before any price is typed.
export const StepOneBaseContext = createContext({ basePrice: 0 });
