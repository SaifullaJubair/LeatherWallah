import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import {
  FiChevronDown,
  FiHeart,
  FiSearch,
  FiShoppingCart,
  FiUser,
  FiX,
} from "react-icons/fi";

const MobileMenu = ({ isOpen, onClose, pathname }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedSubCategory, setExpandedSubCategory] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-80 bg-background border-r border-border overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Menu</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FiX className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Input placeholder="Search products..." className="pl-10" />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Navigation Links */}
          <div className="space-y-2">
            <Link
              href="/shop"
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium",
                pathname === "/shop"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent"
              )}
              onClick={onClose}
            >
              All Products
            </Link>

            {featureCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/category/${category.slug}`}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm font-medium",
                  pathname === `/category/${category.slug}`
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                )}
                onClick={onClose}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Categories */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2">Categories</h3>
            {mockCategories.map((category) => (
              <div key={category._id} className="space-y-1">
                <button
                  className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-md"
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category._id ? null : category._id
                    )
                  }
                >
                  <span>{category.category.category_name}</span>
                  <FiChevronDown
                    className={cn(
                      "w-4 h-4 transition-transform",
                      expandedCategory === category._id && "rotate-180"
                    )}
                  />
                </button>

                {expandedCategory === category._id && (
                  <div className="ml-4 space-y-1">
                    {category.sub_categories.map((subCategory) => (
                      <div key={subCategory._id}>
                        <button
                          className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-accent rounded-md"
                          onClick={() =>
                            setExpandedSubCategory(
                              expandedSubCategory === subCategory._id
                                ? null
                                : subCategory._id
                            )
                          }
                        >
                          <span>{subCategory.sub_category_name}</span>
                          {subCategory.child_categories &&
                            subCategory.child_categories.length > 0 && (
                              <FiChevronDown
                                className={cn(
                                  "w-4 h-4 transition-transform",
                                  expandedSubCategory === subCategory._id &&
                                    "rotate-180"
                                )}
                              />
                            )}
                        </button>

                        {expandedSubCategory === subCategory._id &&
                          subCategory.child_categories && (
                            <div className="ml-4 space-y-1">
                              {subCategory.child_categories.map(
                                (childCategory) => (
                                  <Link
                                    key={childCategory._id}
                                    href={`/category/${category.category.category_slug}/${subCategory.sub_category_slug}/${childCategory.child_category_slug}`}
                                    className="block px-3 py-2 text-sm hover:bg-accent rounded-md"
                                    onClick={onClose}
                                  >
                                    {childCategory.child_category_name}
                                  </Link>
                                )
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* User Actions */}
          <div className="border-t border-border pt-4 space-y-2">
            <Link
              href="/wishlist"
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
              onClick={onClose}
            >
              <FiHeart className="w-4 h-4" />
              Wishlist
            </Link>
            <Link
              href="/checkout"
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
              onClick={onClose}
            >
              <FiShoppingCart className="w-4 h-4" />
              Checkout
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-2 px-3 py-2 hover:bg-accent rounded-md"
              onClick={onClose}
            >
              <FiUser className="w-4 h-4" />
              Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
