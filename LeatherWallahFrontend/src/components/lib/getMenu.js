import { BASE_URL } from "../utils/baseURL";

// Phase 0.5+ (2026-05-31): the legacy 3-level (category → sub → child) endpoint
// `/category/category_sub_child` was removed when the catalog moved to the
// nested-tree model (infinite depth, single `categories` collection). The
// Navbar / Footer / mobile dashboard still consume the OLD shape, so we
// adapt the new `/category/tree` response here. Migrating the consumers to
// the full tree shape is a future cleanup; for now this keeps the menu
// working with no UI changes.
//
// Old shape (consumed):
//   [{ category: {...}, sub_categories: [{...sub, child_categories: [...]}] }]
// New shape (from /category/tree):
//   [{ ...rootCategory, children: [{...subCategory, children: [...]}] }]

const mapChildLevel = (node) => ({
  _id: node?._id,
  child_category_name: node?.category_name,
  child_category_slug: node?.category_slug,
});

const mapSubLevel = (node) => ({
  _id: node?._id,
  sub_category_name: node?.category_name,
  sub_category_slug: node?.category_slug,
  child_categories: (node?.children || []).map(mapChildLevel),
});

const adaptTreeToLegacyMenu = (tree = []) =>
  tree.map((root) => ({
    category: {
      _id: root?._id,
      category_name: root?.category_name,
      category_slug: root?.category_slug,
      category_logo: root?.category_logo,
      category_status: root?.category_status,
      // FeatureCategories.jsx + NewFeatureCategories filter by this flag;
      // without it the homepage featured section renders empty.
      feature_category_show: root?.feature_category_show,
      // Navbar Explore dropdown, Footer category list, SecondNavbar (live in
      // (user-profile) layout), and BottomNavbar all filter by this flag.
      // Without it the user-profile "Explore" menu and the footer category
      // links render empty for every clone.
      explore_category_show: root?.explore_category_show,
    },
    sub_categories: (root?.children || []).map(mapSubLevel),
  }));

export async function getMenu() {
  const res = await fetch(`${BASE_URL}/category/tree`, {
    next: {
      revalidate: 600,
    },
  });

  if (!res.ok) {
    throw new Error("Menu data fetching error!");
  }

  const json = await res.json();
  // Mirror the original wrapper shape: { data: [...] } so consumers like
  // Navbar (which read `dataArray?.data` or fall back to the raw array) keep
  // working without touching them.
  return {
    ...json,
    data: adaptTreeToLegacyMenu(json?.data || []),
  };
}
