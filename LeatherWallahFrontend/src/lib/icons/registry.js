// Curated icon registry shared by the admin Icon Picker and the frontend
// DynamicIcon resolver. Each entry has a stable `key` stored in DB, a `label`
// shown in the picker, free-text `tags` for search, and a `category` for
// grouping. Add new icons by appending — never reorder/rename existing keys
// because that breaks already-saved products.
//
// Key format: <prefix>:<componentName>
//   "fa:FaBriefcase"  -> from react-icons/fa6
//   "lu:Briefcase"    -> from lucide-react
//
// The actual icon components are imported on demand in DynamicIcon.jsx so we
// don't ship every icon to every page.

export const ICON_CATEGORIES = [
  { key: "snacks", label: "Snacks & Food" },
  { key: "fruits", label: "Fruits & Nature" },
  { key: "health", label: "Health & Wellness" },
  { key: "shipping", label: "Shipping & Trust" },
  { key: "people", label: "People & Lifestyle" },
  { key: "commerce", label: "Commerce & Money" },
  { key: "ui", label: "UI & Symbols" },
];

export const ICON_REGISTRY = [
  // ── Snacks & Food ──
  { key: "lu:Cookie", label: "Cookie", tags: "snack biscuit", category: "snacks" },
  { key: "lu:UtensilsCrossed", label: "Utensils", tags: "food eat dining", category: "snacks" },
  { key: "fa:FaUtensils", label: "Utensils (filled)", tags: "food eat", category: "snacks" },
  { key: "lu:Coffee", label: "Coffee / Drink", tags: "drink beverage tea", category: "snacks" },
  { key: "lu:IceCream", label: "Ice Cream", tags: "dessert sweet", category: "snacks" },
  { key: "lu:CakeSlice", label: "Cake", tags: "dessert sweet bake", category: "snacks" },
  { key: "lu:Beef", label: "Meat", tags: "protein", category: "snacks" },
  { key: "lu:Egg", label: "Egg", tags: "protein breakfast", category: "snacks" },
  { key: "lu:Milk", label: "Milk", tags: "dairy drink", category: "snacks" },
  { key: "lu:Wheat", label: "Wheat / Grain", tags: "grain bread fiber", category: "snacks" },

  // ── Fruits & Nature ──
  { key: "lu:Apple", label: "Apple", tags: "fruit", category: "fruits" },
  { key: "lu:Cherry", label: "Cherry", tags: "fruit", category: "fruits" },
  { key: "lu:Grape", label: "Grape", tags: "fruit", category: "fruits" },
  { key: "lu:Citrus", label: "Citrus / Orange", tags: "fruit orange lemon", category: "fruits" },
  { key: "lu:Banana", label: "Banana", tags: "fruit", category: "fruits" },
  { key: "lu:Carrot", label: "Carrot", tags: "vegetable", category: "fruits" },
  { key: "lu:Leaf", label: "Leaf", tags: "natural organic eco", category: "fruits" },
  { key: "fa:FaLeaf", label: "Leaf (filled)", tags: "natural organic eco", category: "fruits" },
  { key: "lu:LeafyGreen", label: "Leafy Green", tags: "vegetable salad", category: "fruits" },
  { key: "lu:Sprout", label: "Sprout", tags: "grow seedling natural", category: "fruits" },
  { key: "fa:FaSeedling", label: "Seedling (filled)", tags: "grow natural", category: "fruits" },
  { key: "lu:Sun", label: "Sun", tags: "dried sunlight bright", category: "fruits" },
  { key: "fa:FaSun", label: "Sun (filled)", tags: "dried sunlight", category: "fruits" },
  { key: "lu:TreePine", label: "Tree", tags: "nature plant", category: "fruits" },
  { key: "lu:Flower", label: "Flower", tags: "nature bloom", category: "fruits" },

  // ── Health & Wellness ──
  { key: "lu:Heart", label: "Heart", tags: "health love care", category: "health" },
  { key: "fa:FaHeart", label: "Heart (filled)", tags: "health love", category: "health" },
  { key: "lu:HeartPulse", label: "Heart Pulse", tags: "health cardio", category: "health" },
  { key: "lu:Activity", label: "Activity / Pulse", tags: "active fitness", category: "health" },
  { key: "lu:Dumbbell", label: "Dumbbell / Gym", tags: "workout fitness exercise", category: "health" },
  { key: "fa:FaDumbbell", label: "Dumbbell (filled)", tags: "gym workout", category: "health" },
  { key: "lu:Pill", label: "Pill / Vitamin", tags: "medicine vitamin", category: "health" },
  { key: "lu:Stethoscope", label: "Stethoscope", tags: "doctor medical", category: "health" },
  { key: "lu:ShieldCheck", label: "Shield Check", tags: "safe verified protection", category: "health" },
  { key: "fa:FaShieldHeart", label: "Shield Heart", tags: "protection care", category: "health" },
  { key: "lu:Sparkles", label: "Sparkles / Clean", tags: "fresh clean shine", category: "health" },
  { key: "lu:Droplets", label: "Droplets", tags: "water hydration fresh", category: "health" },

  // ── Shipping & Trust ──
  { key: "lu:Truck", label: "Truck / Delivery", tags: "shipping fast", category: "shipping" },
  { key: "fa:FaTruckFast", label: "Truck Fast", tags: "shipping express", category: "shipping" },
  { key: "lu:Package", label: "Package / Box", tags: "shipping parcel", category: "shipping" },
  { key: "lu:PackageOpen", label: "Package Open", tags: "shelf life storage", category: "shipping" },
  { key: "fa:FaBoxOpen", label: "Box Open (filled)", tags: "package storage", category: "shipping" },
  { key: "fa:FaBoxArchive", label: "Box Archive", tags: "storage", category: "shipping" },
  { key: "lu:MapPin", label: "Map Pin", tags: "location address", category: "shipping" },
  { key: "lu:Globe", label: "Globe", tags: "country worldwide nation", category: "shipping" },
  { key: "fa:FaFlag", label: "Flag", tags: "country made-in", category: "shipping" },
  { key: "lu:BadgeCheck", label: "Badge Check", tags: "verified trust certified", category: "shipping" },
  { key: "fa:FaAward", label: "Award", tags: "premium quality trust", category: "shipping" },
  { key: "lu:Award", label: "Award (outline)", tags: "premium quality", category: "shipping" },
  { key: "fa:FaCertificate", label: "Certificate", tags: "certified verified", category: "shipping" },
  { key: "lu:Lock", label: "Lock", tags: "secure safe privacy", category: "shipping" },
  { key: "lu:RotateCcw", label: "Return / Refund", tags: "return refund undo", category: "shipping" },
  { key: "fa:FaArrowRotateLeft", label: "Arrow Rotate (return)", tags: "return refund", category: "shipping" },
  { key: "lu:Recycle", label: "Recycle / Eco", tags: "eco sustainable", category: "shipping" },

  // ── People & Lifestyle ──
  { key: "lu:Briefcase", label: "Briefcase / Office", tags: "work office job", category: "people" },
  { key: "fa:FaBriefcase", label: "Briefcase (filled)", tags: "work office", category: "people" },
  { key: "lu:Baby", label: "Baby / Child", tags: "kids children infant", category: "people" },
  { key: "fa:FaChild", label: "Child (filled)", tags: "kids children", category: "people" },
  { key: "lu:GraduationCap", label: "School / Student", tags: "study tiffin", category: "people" },
  { key: "lu:Plane", label: "Plane / Travel", tags: "travel trip vacation", category: "people" },
  { key: "fa:FaPlane", label: "Plane (filled)", tags: "travel", category: "people" },
  { key: "lu:Home", label: "Home", tags: "house family", category: "people" },
  { key: "lu:Users", label: "Family / Guests", tags: "family people guests", category: "people" },
  { key: "lu:Smile", label: "Smile / Happy", tags: "satisfaction joy", category: "people" },
  { key: "lu:HandHeart", label: "Hand with Heart", tags: "care thanks", category: "people" },
  { key: "fa:FaHandHoldingHeart", label: "Hand Heart (filled)", tags: "care hand", category: "people" },
  { key: "fa:FaThumbsUp", label: "Thumbs Up", tags: "approve like satisfaction", category: "people" },

  // ── Commerce & Money ──
  { key: "lu:ShoppingBag", label: "Shopping Bag", tags: "buy cart", category: "commerce" },
  { key: "lu:ShoppingCart", label: "Shopping Cart", tags: "cart buy", category: "commerce" },
  { key: "lu:Wallet", label: "Wallet", tags: "money pay", category: "commerce" },
  { key: "lu:CreditCard", label: "Credit Card", tags: "pay payment", category: "commerce" },
  { key: "fa:FaMoneyBillWave", label: "Money / COD", tags: "cash payment", category: "commerce" },
  { key: "lu:Banknote", label: "Banknote", tags: "cash money", category: "commerce" },
  { key: "lu:Percent", label: "Percent / Discount", tags: "offer sale", category: "commerce" },
  { key: "lu:Tag", label: "Tag / Price", tags: "price label", category: "commerce" },
  { key: "lu:Gift", label: "Gift / Offer", tags: "free promo", category: "commerce" },
  { key: "lu:Flame", label: "Flame / Hot", tags: "hot trending deal", category: "commerce" },
  { key: "lu:Crown", label: "Crown / Premium", tags: "premium quality", category: "commerce" },
  { key: "lu:Star", label: "Star", tags: "rating premium", category: "commerce" },
  { key: "lu:Sparkle", label: "Sparkle", tags: "new shiny premium", category: "commerce" },

  // ── UI & Symbols ──
  { key: "lu:Check", label: "Check", tags: "tick done", category: "ui" },
  { key: "lu:CheckCircle", label: "Check Circle", tags: "tick verified done", category: "ui" },
  { key: "lu:X", label: "X / Close", tags: "close no cross", category: "ui" },
  { key: "lu:Info", label: "Info", tags: "information detail", category: "ui" },
  { key: "lu:Zap", label: "Zap / Energy", tags: "fast energy power lightning", category: "ui" },
  { key: "lu:Clock", label: "Clock", tags: "time hours fast", category: "ui" },
  { key: "lu:Timer", label: "Timer", tags: "countdown time", category: "ui" },
  { key: "lu:Calendar", label: "Calendar / Date", tags: "shelf life date", category: "ui" },
  { key: "lu:Eye", label: "Eye / View", tags: "view see preview", category: "ui" },
  { key: "lu:Bell", label: "Bell / Notify", tags: "alert notification", category: "ui" },
  { key: "lu:Phone", label: "Phone", tags: "call contact", category: "ui" },
  { key: "lu:Mail", label: "Mail / Email", tags: "contact email", category: "ui" },
];

// Helpers
export function findIcon(key) {
  return ICON_REGISTRY.find((i) => i.key === key) || null;
}

export function searchIcons(query, category) {
  const q = (query || "").trim().toLowerCase();
  return ICON_REGISTRY.filter((i) => {
    if (category && category !== "all" && i.category !== category) return false;
    if (!q) return true;
    return (
      i.label.toLowerCase().includes(q) ||
      i.tags.toLowerCase().includes(q) ||
      i.key.toLowerCase().includes(q)
    );
  });
}
