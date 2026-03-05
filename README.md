# StackShop — Full Stack Assessment

## Overview

This is my submission for the Stackline Full Stack Engineer assessment. I forked the provided repository, reviewed the code thoroughly, and fixed a range of bugs spanning security vulnerabilities, broken functionality, and UX issues. Below is a detailed account of everything I identified and changed, along with my though process and reasoning.


## Approach

I started by mapping and understanding the full project structure before touching any code - API routes, service layer, pages, and config. This helped me understand how data flows through the app. Once I had the full picture and clarity, I worked through fixes in order of severity, committing each logical change separately.


## Bug Fixes

### Security

#### 1. Product data exposed via URL query string
**File:** `app/page.tsx`, `app/product/page.tsx`

The original implementation passed the entire product object as a JSON-serialized query parameter when navigating to the product detail page:
```ts
href={{ pathname: "/product", query: { product: JSON.stringify(product) } }}
```
This is problematic for a few reasons. URLs have length limits and can break with large payloads. More importantly, the full product object - including internal fields like `retailerSku` — was visible in the browser history, server logs, and to anyone who could see the URL. It also meant users could manipulate the data directly in the URL.

**Fix:** Replaced this with a proper dynamic route at `/product/[sku]`. The detail page now fetches product data from `/api/products/:sku` on load, keeping URLs clean and data server-authoritative.

#### 2. Internal SKU exposed in the product detail UI
**File:** `app/product/[sku]/page.tsx`

The original page displayed `retailerSku` - an internal identifier referring the retailer's system, directly on the customer-facing product page. This leaks internal business data unnecessarily.

**Fix:** Replaced `retailerSku` with `stacklineSku`, which is the appropriate public-facing identifier.

#### 3. Unrestricted image hostname patterns in Next.js config
**File:** `next.config.ts`

The original config whitelisted `m.media-amazon.com` for Next.js image optimization but placed no restriction on which paths could be loaded from that domain. Additionally, a second Amazon CDN hostname used by some products (`images-na.ssl-images-amazon.com`) was missing entirely, causing runtime errors when those images tried to load.

**Fix:** Added the missing hostname and scoped both entries with `pathname: '/images/**'` to limit image optimization to the expected path only.

---

### Functionality

#### 4. Subcategory filter fetched all subcategories regardless of selected category
**File:** `app/page.tsx`

When a user selected a category, the app fetched subcategories from `/api/subcategories` without passing the selected category as a query parameter. This meant every subcategory across all categories was returned, making the filter useless.

**Fix:** Updated the fetch call to include the selected category:
```ts
fetch(`/api/subcategories?category=${selectedCategory}`)
```

#### 5. No dynamic route for product detail page
**File:** `app/product/page.tsx` -> `app/product/[sku]/page.tsx`

The product detail page lived at a flat `/product` route with no slug or identifier in the URL. This made it impossible to share or bookmark a specific product, and the page had no independent identity.

**Fix:** Moved the page to `app/product/[sku]/page.tsx` using Next.js dynamic routing. Each product now has a stable, shareable URL.

#### 6. No input validation on `limit` and `offset` query params
**File:** `app/api/products/route.ts`

The products API accepted `limit` and `offset` directly from query params and passed them to `parseInt()` without any bounds checking. A request with `limit=-1` or `limit=999999` would go straight through to the service layer.

**Fix:** Added bounds validation to ensure `limit` is between 1 and 100, and `offset` is floored at 0:
```ts
limit: Math.min(Math.max(parseInt(searchParams.get('limit')!), 1), 100)
offset: Math.max(parseInt(searchParams.get('offset')!), 0)
```

#### 7. No error handling on API routes
**Files:** `app/api/products/route.ts`, `app/api/categories/route.ts`, `app/api/subcategories/route.ts`

None of the API routes had any error handling. If the service layer threw errors for any reason, the route would crash with an unhandled exception and return no meaningful response to the client.

**Fix:** Wrapped all service calls in try/catch blocks and returned proper `500` responses with error messages on failure.

#### 8. No error handling on client-side fetch calls
**File:** `app/page.tsx`

None of the three fetch calls on the product list page had `.catch()` handlers. The most critical case was the products fetch - if it failed, `setLoading(false)` would never be called and the UI would hang indefinitely on "Loading products...".

**Fix:** Added `.catch()` to all three fetch calls, resetting state to safe defaults and ensuring `loading` is always set to `false`.

---

### UX

#### 9. Product detail page had no loading state
**File:** `app/product/[sku]/page.tsx`

The original page jumped straight from nothing to "Product not found" while the fetch was still in flight, showing incorrect content before the product data is loaded.

**Fix:** Added a `loading` state that shows "Loading product..." while the fetch is in progress, and a separate `error` state for genuine failures.

#### 10. Search triggered an API call on every keypress
**File:** `app/page.tsx`

The search input was directly wired to the products fetch with no debounce. Every single keystroke fired a new request to `/api/products`, which is unnecessary and would cause performance issues at scale.

**Fix:** Added a 300ms debounce using a `useEffect` with `setTimeout`/`clearTimeout`. The API is only called after the user stops typing.

#### 11. "Showing X products" displayed page count, not total
**File:** `app/page.tsx`

The product list showed "Showing 20 products" even when there were hundreds of results. This is misleading as the users had no way to know there were more products beyond the first page.

**Fix:** The API already returns a `total` field in its response. Added a `totalCount` state and updated the label to "Showing 20 of 500 products".

#### 12. Placeholder metadata left in layout
**File:** `app/layout.tsx`

The app's `<title>` and `<meta description>` were still set to Next.js boilerplate defaults ("Create Next App" / "Generated by create next app").

**Fix:** Updated to "StackShop" and a relevant description.


## What I'd Do With More Time

- **Pagination** - the API already supports `limit` and `offset`, but the frontend always fetches page 1. Adding pagination or infinite scroll would make the product list actually usable at scale.
- **Test coverage** - there are no tests in the project. I'd add unit tests for the `ProductService` methods and integration tests for the API routes at minimum.
- **Search improvements** - the current search uses simple substring matching, which causes edge cases like "meta" matching "Metallic". A word-boundary regex or a proper search library would make results more accurate.
- **Error states on the product list page** - right now a fetch failure silently shows "No products found", which is indistinguishable from a legitimate empty result. A dedicated error message would improve clarity.
