// Per-section info modal copy (Bangla + English mix, real leather-shop examples).
// Each exported JSX is consumed by <SectionInfoModal> in ProductForm.jsx.
//
// Keep the tone conversational — owner reads these mid-form to quickly recall
// "ki, kobe, kivabe". Real numbers/examples beat abstract definitions.

import { Fragment } from "react";

export const logisticsInfo = (
  <Fragment>
    <h4>📦 কী এই section?</h4>
    <p>
      Product-এর physical attribute + tax + warranty info। Courier rate calc,
      VAT charge, customer-এর warranty/return claim — সব এই গুলোর উপর depend।
    </p>

    <h4>কোন field-টা কখন?</h4>
    <ul>
      <li>
        <strong>Weight (grams)</strong> — courier (Pathao/Steadfast) এর rate weight
        দিয়ে calculate করে। 500g vs 5kg-এর shipping cost আলাদা। খালি রাখলে courier
        default ধরবে।
      </li>
      <li>
        <strong>VAT override (%)</strong> — site-wide default VAT % আছে Settings-এ।
        কোনো specific product-এর VAT আলাদা হলে এখানে % দিন। ০ / blank রাখলে site
        default ব্যবহার হবে।
      </li>
      <li>
        <strong>Dimensions (L/W/H cm)</strong> — কিছু courier volumetric weight
        ধরে (size বড় হলে weight কম হলেও বেশি charge)। Pre-emptive measure।
      </li>
      <li>
        <strong>Warehouse</strong> — কোন warehouse থেকে এই product ship হবে। শুধু
        একাধিক warehouse থাকলে কাজে আসে।
      </li>
      <li>
        <strong>Warranty note</strong> + <strong>Return policy note</strong> — PDP-তে
        free-text হিসেবে দেখাবে। Customer claim-এর সময় reference।
      </li>
    </ul>

    <h4>👞 Example — Classic Oxford (EU 42)</h4>
    <table>
      <tbody>
        <tr><th>Weight</th><td>900 grams (with box)</td></tr>
        <tr><th>VAT override</th><td>(blank) — site default 5%</td></tr>
        <tr><th>Dimensions</th><td>33 × 22 × 12 cm (shoe box)</td></tr>
        <tr><th>Warehouse</th><td>Dhaka Main</td></tr>
        <tr><th>Warranty note</th><td>6 months on stitching and sole</td></tr>
        <tr><th>Return note</th><td>Size mismatch → free exchange within 7 days</td></tr>
      </tbody>
    </table>

    <h4>💡 কখন skip করবেন</h4>
    <p>
      ছোট shop যদি শুধু flat-rate delivery use করে এবং VAT না নেয় — সব ফাঁকা
      রাখুন, কোনো সমস্যা নেই।
    </p>
  </Fragment>
);

export const bulkPricingInfo = (
  <Fragment>
    <h4>💰 কী এই section?</h4>
    <p>
      Discount system — দুটো ভিন্ন trigger। <strong>Tier</strong> = কতগুলো কিনছে
      তার উপর; <strong>Group</strong> = কে কিনছে তার উপর।
    </p>

    <h4>🔹 Tier Prices (কতগুলো কিনলে discount)</h4>
    <p>
      "যত বেশি কিনবে, তত কম দাম।" Wholesale-এর মত automatic discount, যে কেউ পেতে
      পারে — শুধু qty বাড়ালেই।
    </p>

    <h4>👔 Example — Genuine Leather Belt (regular ৳1200 each)</h4>
    <table>
      <thead>
        <tr><th>Min qty</th><th>Price at this tier</th><th>মানে</th></tr>
      </thead>
      <tbody>
        <tr><td>(default)</td><td>৳1200</td><td>১-৪ টা — full price</td></tr>
        <tr><td>5</td><td>৳1050</td><td>৫+ নিলে প্রতিটা ৳1050</td></tr>
        <tr><td>10</td><td>৳950</td><td>১০+ নিলে প্রতিটা ৳950</td></tr>
        <tr><td>50</td><td>৳820</td><td>৫০+ নিলে প্রতিটা ৳820 (bulk/corporate)</td></tr>
      </tbody>
    </table>
    <p>
      <strong>System logic:</strong> "lowest matching tier wins" — যে tier-গুলোর
      min_qty cart-qty-এর ≤, তাদের মধ্যে সবচেয়ে কম price-টা apply।
    </p>
    <p>
      <strong>Customer calc:</strong> ১২ pack অর্ডার → tier ১০ apply → ৳160 × 12 = ৳1920
    </p>

    <h4>🔹 Group Prices (কে কিনছে তার উপর discount)</h4>
    <p>
      "Wholesale partner / VIP customer-দের জন্য আলাদা দাম।" Qty যাই হোক, login
      করা customer-এর <code>customer_group</code> tag-এর উপর depend।
    </p>
    <p>
      <strong>Setup:</strong> প্রথমে Admin → Customers → কোনো customer-কে edit করে{" "}
      <code>customer_group</code> field <code>wholesale</code> / <code>vip</code>{" "}
      সেট করুন। Default সবাই <code>retail</code>।
    </p>

    <h4>🍎 Example — Premium Dried Apple (regular ৳300/pack)</h4>
    <table>
      <thead>
        <tr><th>Group</th><th>Price for this group</th><th>মানে</th></tr>
      </thead>
      <tbody>
        <tr><td>(default retail)</td><td>৳300</td><td>সাধারণ customer</td></tr>
        <tr><td>Wholesale</td><td>৳220</td><td>আপনার wholesale partner-দের জন্য</td></tr>
        <tr><td>VIP</td><td>৳260</td><td>VIP loyalty customer-দের জন্য</td></tr>
      </tbody>
    </table>

    <h4>🔹 Tier vs Group — পার্থক্য</h4>
    <table>
      <thead><tr><th></th><th>Tier</th><th>Group</th></tr></thead>
      <tbody>
        <tr><td>Trigger</td><td>Cart qty</td><td>Customer-এর tag</td></tr>
        <tr><td>কে পায়</td><td>যে কেউ যথেষ্ট qty নিলে</td><td>শুধু tagged customer</td></tr>
        <tr><td>Setup-এ দরকার</td><td>শুধু product-level</td><td>Customer-এ tag করা লাগে</td></tr>
        <tr><td>Use case</td><td>"Bulk = সস্তা" public deal</td><td>Private partner pricing</td></tr>
      </tbody>
    </table>

    <h4>দুটোই থাকলে?</h4>
    <p>
      System "best price wins" logic চালায়। Wholesale customer ১০ pack নিলে →{" "}
      tier ১০ price (৳160) vs wholesale price (৳220) → <strong>৳160 জিতবে</strong>।
    </p>

    <h4>💡 সাধারণ shop-এর জন্য সাজেশন</h4>
    <ul>
      <li>Tier prices = useful (bulk buyers attract করতে)</li>
      <li>Group prices = পরে যখন wholesale partner / VIP customer scheme শুরু করবেন</li>
    </ul>
  </Fragment>
);

export const customSpecRowsInfo = (
  <Fragment>
    <h4>📋 কী এই section?</h4>
    <p>
      PDP-তে (Product Detail Page) "extra spec table" দেখানোর জন্য free-form
      fields। Amazon-এ "Product Details" section-এ যেমন থাকে — একই rkm।
    </p>

    <h4>কখন use করবেন</h4>
    <p>
      যখন এমন information দেখাতে চান যেটা attribute system-এ পড়ে না (Size/Color
      এর মত variation নয়), কিন্তু customer-এর জানা দরকার।
    </p>

    <h4>👞 Example — Classic Oxford-এর PDP-তে দেখাতে চান:</h4>
    <table>
      <thead><tr><th>Label</th><th>Value</th><th>Icon</th></tr></thead>
      <tbody>
        <tr><td>Upper Material</td><td>Full-grain cow leather</td><td>🧱 (lu:Layers)</td></tr>
        <tr><td>Construction</td><td>Goodyear welted</td><td>✅ (lu:BadgeCheck)</td></tr>
        <tr><td>Outsole</td><td>Rubber (anti-slip)</td><td>👣 (lu:Footprints)</td></tr>
        <tr><td>Warranty</td><td>6 months</td><td>🛡️ (lu:ShieldCheck)</td></tr>
        <tr><td>Origin</td><td>Handmade in Bangladesh</td><td>📍 (lu:MapPin)</td></tr>
      </tbody>
    </table>

    <h4>🔹 Custom Fields vs Attributes — পার্থক্য</h4>
    <table>
      <thead><tr><th></th><th>Custom Spec Rows</th><th>Attributes</th></tr></thead>
      <tbody>
        <tr><td>Filterable?</td><td>না</td><td>হ্যাঁ (sidebar filter)</td></tr>
        <tr><td>Variations create করে?</td><td>না</td><td>"Variation axis" on করলে হ্যাঁ</td></tr>
        <tr><td>Centrally managed?</td><td>না, প্রতি product-এ আলাদা টাইপ</td><td>হ্যাঁ (Attributes module)</td></tr>
        <tr><td>Use case</td><td>"এক বার দেখানোর জন্য" descriptive info</td><td>Categorisable, multi-product common values</td></tr>
      </tbody>
    </table>

    <h4>উদাহরণে পার্থক্য:</h4>
    <ul>
      <li>"Size: EU 41 / 42 / 43" → <strong>Attribute + Variation axis</strong> (filterable, প্রতিটার আলাদা stock/price)</li>
      <li>"Brand: Leather Wallah" → <strong>Attribute</strong> (filterable, কিন্তু no variation)</li>
      <li>"Origin: Handmade in BD" → <strong>Custom Spec Row</strong> (এই specific product-এর info)</li>
      <li>"Construction: Goodyear welted" → <strong>Custom Spec Row</strong> (free-form descriptive)</li>
    </ul>

    <h4>🎨 Icon Key</h4>
    <p>
      Icon dropdown থেকে pick করতে পারেন (search করা যাবে)। ফাঁকা রাখলে শুধু text
      দেখাবে, no icon। Pick করা icon PDP-তে value-এর পাশে render হবে।
    </p>
  </Fragment>
);

export const pricingStockInfo = (
  <Fragment>
    <h4>💰 কী এই section?</h4>
    <p>
      Product-এর দাম, stock, এবং variation matrix এখানে। দুই mode:
    </p>
    <ul>
      <li>
        <strong>Simple product</strong> → একটাই price + একটাই stock।
      </li>
      <li>
        <strong>Variable product</strong> → attributes (Size/Color/etc.) pick করে
        matrix generate, প্রতিটার আলাদা price/stock/image।
      </li>
    </ul>

    <h4>🔹 Attribute vs Variation axis — মূল ধারণা</h4>
    <p>
      Product-এ attribute add করার ২টা উদ্দেশ্য:
    </p>
    <table>
      <thead><tr><th></th><th>Axis OFF (Spec-only)</th><th>Axis ON (Variation)</th></tr></thead>
      <tbody>
        <tr>
          <td>কী হয়</td>
          <td>শুধু PDP spec table-এ দেখায় + sidebar filter</td>
          <td>প্রতি value-এর জন্য আলাদা variation create</td>
        </tr>
        <tr>
          <td>আলাদা price?</td>
          <td>না</td>
          <td>হ্যাঁ</td>
        </tr>
        <tr>
          <td>আলাদা stock?</td>
          <td>না</td>
          <td>হ্যাঁ</td>
        </tr>
        <tr>
          <td>Customer pick করে?</td>
          <td>না (just info)</td>
          <td>হ্যাঁ (PDP picker)</td>
        </tr>
      </tbody>
    </table>

    <h4>👞 Example 1 — Classic Oxford (3 sizes)</h4>
    <ul>
      <li>Attributes: <strong>Size</strong>, <strong>Material</strong></li>
      <li>Size values: EU 41, EU 42, EU 43 → axis <strong>ON</strong></li>
      <li>Material value: Full-grain leather → axis <strong>OFF</strong> (সব সাইজই একই চামড়ার)</li>
      <li>Matrix: 3 rows (EU 41, 42, 43), প্রতিটার আলাদা price/stock</li>
      <li>PDP spec table-এ দেখাবে "Material: Full-grain leather"</li>
      <li>Filter sidebar-এ "Material: Full-grain leather" দিয়ে filter করা যাবে</li>
    </ul>

    <h4>👢 Example 2 — Chelsea Boot (Size + Color, both axes)</h4>
    <ul>
      <li>Size = [M, L, XL] axis ON</li>
      <li>Color = [Black, Navy] axis ON</li>
      <li>Matrix: 3 × 2 = <strong>6 rows</strong> (cartesian product)</li>
      <li>প্রতি combination-এর আলাদা price/stock/image</li>
    </ul>

    <h4>🔧 Matrix row-এ field-গুলো</h4>
    <ul>
      <li><strong>Price delta</strong> = base price থেকে এই variation কত বেশি/কম</li>
      <li><strong>Final price</strong> = base + delta (auto, read-only)</li>
      <li><strong>Buying price</strong> = আপনি কত-এ কিনেছেন (profit calc-এর জন্য, customer দেখে না)</li>
      <li><strong>Stock</strong> = এই specific combination-এর stock</li>
      <li><strong>Active</strong> toggle = customer-এর জন্য available কিনা</li>
      <li><strong>Image</strong> = main_image/other_images থেকে pick, বা নতুন upload</li>
    </ul>

    <h4>⚡ Bulk apply</h4>
    <p>
      একসাথে সব row-তে same price delta + stock apply করার shortcut। তারপর
      আলাদা row-গুলো manually tweak করতে পারেন।
    </p>

    <h4>💡 সাধারণ shop-এর জন্য সাজেশন</h4>
    <ul>
      <li>একদম simple product → variation-ই skip করুন, single price + stock</li>
      <li>শুধু size variation → Size axis ON</li>
      <li>Origin/Brand/Certification-এর মত info → Spec-only (axis OFF)</li>
      <li>Matrix বড় হলে Bulk apply দিয়ে base setup করে নিন</li>
    </ul>
  </Fragment>
);

export const seoInfo = (
  <Fragment>
    <h4>🔍 কী এই section?</h4>
    <p>
      Search engine (Google/Bing) এবং social media (Facebook share preview) এ
      কীভাবে দেখাবে সেটার তথ্য। SEO ভালো হলে organic traffic বাড়ে।
    </p>

    <h4>Field-গুলো</h4>
    <ul>
      <li>
        <strong>Meta title</strong> — Google search result-এ এই product-এর নীল link
        title হিসেবে দেখাবে। ৬০ characters-এর মধ্যে রাখুন। খালি রাখলে product
        name use হবে।
      </li>
      <li>
        <strong>Meta description</strong> — Google search result-এ title-এর নিচে
        ২-৩ লাইন description। ১৫৫ characters-এর মধ্যে keyword-rich + appealing
        লিখুন।
      </li>
      <li>
        <strong>Meta keywords</strong> — Google এ direct effect নেই (deprecated)
        কিন্তু internal site-search-এ এবং কিছু analytics tool-এ কাজে আসে। Type
        করে Enter বা comma দিলে tag হবে।
      </li>
    </ul>

    <h4>👞 Example — Leather Shoe PDP</h4>
    <table>
      <tbody>
        <tr>
          <th>Meta title</th>
          <td>Premium Genuine Leather Shoes | Handcrafted | Leather Wallah</td>
        </tr>
        <tr>
          <th>Meta description</th>
          <td>Handcrafted genuine leather shoes for men. Durable, comfortable, premium quality. Cash on delivery across Bangladesh — order now।</td>
        </tr>
        <tr>
          <th>Meta keywords</th>
          <td>leather shoes bd, genuine leather footwear, mens leather shoes bangladesh, handmade shoes dhaka</td>
        </tr>
      </tbody>
    </table>

    <h4>💡 সাধারণ shop-এর জন্য সাজেশন</h4>
    <p>
      Bare minimum: Meta title + Meta description ভরুন। Hero Content page-এ OG
      title / OG description / OG image — Facebook share-এর জন্য সেগুলো বেশি
      important।
    </p>
  </Fragment>
);
