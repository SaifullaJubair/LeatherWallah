export const productSliderData = [
  {
    id: 1,
    productName: "Product 1",
    image: "/assets/images/slider/slider-1.png",
    productUrl: "https://example.com/product1",
    description: "Description for Product 1.",
  },
  {
    id: 2,
    productName: "Product 2",
    image: "/assets/images/slider/slider-2.png",
    productUrl: "https://example.com/product2",
    description: "Description for Product 2.",
  },
  {
    id: 3,
    productName: "Product 3",
    image: "/assets/images/slider/slider-3.jpg",
    productUrl: "https://example.com/product3",
    description: "Description for Product 3.",
  },
];

export const menuData = [
  {
    label: "Laptop",
    href: "/buy",
    children: [
      {
        label: "Gamming Laptop",
        children: [
          {
            label: "Asus",
            href: "#",
          },
          { label: "Lenovo", href: "#" },
          { label: "Dell", href: "#" },
        ],
      },
      {
        label: "Laptop Bag",
        children: [
          {
            label: "HP",
            href: "#",
          },
          { label: "MSI", href: "#" },
          { label: "Max Green", href: "#" },
        ],
      },
    ],
  },
  {
    label: "Desktop",
    href: "/desktop",
    children: [
      {
        label: "Star Pc",
        href: "#",
        children: [
          {
            label: "Intel Pc",
            href: "#",
          },
        ],
      },
      {
        label: "Gamming Pc",
        href: "#",
        children: [
          {
            label: "Ryjen pc",
          },
        ],
      },
    ],
  },
  {
    label: "Monitor",
    href: "#",
  },
];
