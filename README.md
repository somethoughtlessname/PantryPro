# Pantry Pro

A mobile-first progressive web app for managing household food inventory, grocery shopping, price comparison, and spend tracking. Runs entirely in the browser — all data is stored locally on the device with no backend required.

---

## Installation

Pantry Pro is a PWA and can be installed directly from the browser with no build tooling required.

1. Open the app URL in a mobile browser
2. Select **Add to Home Screen** from the browser menu
3. The app will install and run fully offline via service worker

---

## File Structure

```
index.html    — App shell, page layout, all overlay windows
styles.js     — Injects all CSS at runtime
app.js        — Core logic: navigation, settings, modals, stats, sales
tabs.js       — Grocery List, Comp Shop, and My Store rendering
pantry.js     — Pantry tab: cards, containers, delta log, snapshots
recipes.js    — Recipes and Meals windows
```

---

## Navigation

Three tabs sit in a fixed header: Grocery List, My Pantry, and Stats. A slide-out sidebar is accessible by swiping from either edge of the screen and opens from the side you swipe from. The sidebar is organised into four sections: Shop, Cook, Manage, and App.

---

## Grocery List

The default tab on load. Type in the search bar to find existing items from your store catalogue or add new ones on the spot. Items are grouped by category with a filter bar for All, Unchecked, and Checked views. The footer button unchecks all items or clears the list with a second tap.

---

## My Pantry

Tracks stock levels for items in your home. Each item can have one or more containers with a defined capacity, unit, and price per container. Adjusting stock with the plus and minus buttons logs a delta entry used for spend analytics.

Two view modes are available: Pantry Mode shows only items with active containers, and All Grocery Items shows the full catalogue. A filter bar allows filtering by stock status — On-Hand, Partial, Low, and Critical. Threshold percentages for each status level are configurable in Settings. Smart Sort tracks interaction frequency and automatically reorders items and categories to surface the ones you use most.

---

## Stats

Displays spend and consumption data drawn from the pantry delta log. The Used and Purchased tabs switch between cost of items consumed and cost of items restocked. Daily, Weekly, and Monthly views are available.

Tapping an item in the list below the chart isolates its data in the graph. Multiple items can be selected to view combined totals, shown in blue. A single selected item shows dollar spend and unit consumption stacked above each daily bar.

---

## Comp Shop

A price comparison tool for tracking unit prices across stores. Each entry records a store, quantity, and price. Sale prices with an expiry date can also be logged. The best unit price is highlighted automatically. Accessed from the sidebar under Shop.

---

## My Store

The master item catalogue used across the app. Adding an item here makes it available in the Grocery List, Comp Shop, and Pantry. Each item has a category and unit of measurement. Category and unit can be changed by tapping the respective badges on each item row.

---

## Recipes and Meals

Recipes store ingredient lists with amounts and step-by-step instructions. Cooking a recipe deducts ingredients from the pantry automatically and creates a Meal entry to track how long it lasts. Meal history is recorded once finished.

---

## Sales

A log of known sale prices for items across stores. Each entry includes a store, price, and optional end date. Active sales are flagged on the Grocery List and within Comp Shop entries.

---

## Settings

Accessed from the sidebar under App. Split into three tabs:

- **Pantry** — threshold levels for Partial, Low, and Critical status; snap increment for sliders; Smart Sort toggle and reset
- **App** — Comp Shop price preview count; auto-scroll and focus dim on card open
- **Data** — Clear All Data; Reset Stats Data

---

## Data Export and Import

All app data can be exported as a single JSON file and reimported to restore state on any device. Accessed from the sidebar under App. Pantry interaction counts and sort data are excluded from exports as they are device-specific preferences.

---

## Storage

All data is stored in `localStorage`. There is no account system, no server, and no network requests beyond the initial page load. The app functions fully offline once installed as a PWA.
