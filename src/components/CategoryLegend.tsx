import { SPENDING_CATEGORIES } from "../data/categories";
import styles from "./CategoryLegend.module.css";

/**
 * Expandable reference under the matrix explaining what each spending category
 * means. Rendered from the same registry that drives the matrix rows, so the
 * table and its definitions can never drift apart. Each entry is an anchor
 * target (`#category-<id>`) that the matrix row labels link to; the `:target`
 * style highlights the entry that was jumped to.
 */
const CategoryLegend = () => {
  return (
    <details className={styles.legend} id="category-legend">
      <summary className={styles.summary}>What counts in each category?</summary>
      <p className={styles.intro}>
        Issuers bucket each purchase by how the merchant is coded, not by what you
        bought — so a category can miss purchases you would expect it to cover.
        Each definition below carries the one gotcha most likely to surprise you.
        Spending caps are card-specific and listed on each card&apos;s detail page.
      </p>
      <dl className={styles.list}>
        {SPENDING_CATEGORIES.map((category) => (
          <div
            key={category.id}
            id={`category-${category.id}`}
            className={styles.item}
          >
            <dt className={styles.term}>
              {category.label}
              {category.kind === "brand" && (
                <span className={styles.brandBadge}>brand-specific</span>
              )}
            </dt>
            <dd className={styles.definition}>
              <p className={styles.description}>{category.description}</p>
              {category.includes?.length ? (
                <p className={styles.includes}>
                  e.g. {category.includes.join(", ")}
                </p>
              ) : null}
              {category.watchOut ? (
                <p className={styles.watchOut}>
                  <strong>Watch out:</strong> {category.watchOut}
                </p>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
};

export default CategoryLegend;
