import type { CategoryId } from "../types/category";

/** 24×24 line icons, one per spending category. */
const PATHS: Record<CategoryId, string> = {
  "usd-spend": "M12 3v18M16.5 7.5C16 6 14.3 5.2 12 5.2c-2.6 0-4.4 1.2-4.4 3.2 0 4.6 9 2.2 9 6.9 0 2.1-1.9 3.5-4.6 3.5-2.5 0-4.4-1-4.9-2.8",
  restaurant: "M7 3v7a2 2 0 0 0 2 2v9M5 3v5M9 3v5M9 12a2 2 0 0 0 2-2V3M17 21v-7h-2V8c0-3 1.2-5 2-5v18",
  groceries: "M3 4h2.2l2.3 11.2h10l2-8.2H6.2M9 20.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM16.5 20.2a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  costco: "M3 21V9l9-5 9 5v12M7 21v-8h10v8M7 17h10M12 13v8",
  gas: "M5 21V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16M3.5 21h12M7.5 6.5h4v4h-4zM14 12h1.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8.5L17 5.5",
  travel: "M10.5 13.5 3 11l1.5-1.5 7 .5 4.8-4.8c1-1 2.6-1.3 3.2-.7.6.6.3 2.2-.7 3.2L14 12.500l.5 7L13 21l-2.5-7.500Zm0 0L6 18M6 18l-2.500-.5M6 18l.5 2.500",
  transit: "M7 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM5 10.500h14M8.500 14h.01M15.500 14h.01M8 17l-2 4M16 17l2 4",
  entertainment: "M4 6h16v3.500a2.500 2.500 0 0 0 0 5V18H4v-3.500a2.500 2.500 0 0 0 0-5ZM14 6v2M14 11v2M14 16v2",
  general: "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM3 10h18M7 15h3",
  "ct-stores": "M4 10v10h16V10M3 10l2-6h14l2 6ZM10 20v-5h4v5",
};

interface CategoryIconProps {
  category: CategoryId;
  className?: string;
}

/** Decorative: always rendered beside the category's text label. */
const CategoryIcon = ({ category, className }: CategoryIconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={PATHS[category]} />
  </svg>
);

export default CategoryIcon;
