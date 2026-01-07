# Product Filtering Logic Documentation

## Filter Behavior

When users select multiple values across different facet types, the filtering works as follows:

### Rule: AND across facet types, OR within each facet type

- **City (Special Rule)**: If city is selected, it's MANDATORY - products MUST be available in selected city/cities
- **Multiple Cities**: If multiple cities selected, products must be available in ANY of them (OR)
- **Other Facets (Color, Material, Product Type, Occasion)**: Products can match ANY selected value (OR within each type)
- **Across Facet Types**: Products must match ALL selected facet types (AND)
- **No City Selected**: Show products from all cities

## Examples

### Example 1: Black, Red, and Silk
**Selected:**
- Colors: Black, Red
- Materials: Silk

**Result:** Products that have:
- (Black AND Silk) OR (Red AND Silk)
- = Products with Silk material AND (Black OR Red color)

**SQL Logic:**
```sql
WHERE product has Silk material
  AND (product has Black color OR product has Red color)
```

### Example 2: Rajkot, Red, Black, and Silk
**Selected:**
- Cities: Rajkot
- Colors: Red, Black
- Materials: Silk

**Result:** Products that have:
- (Red AND Silk AND Rajkot) OR (Black AND Silk AND Rajkot)
- = Products with (Red OR Black) color AND Silk material AND Rajkot city

**SQL Logic:**
```sql
WHERE product has Rajkot city
  AND product has Silk material
  AND (product has Red color OR product has Black color)
```

### Example 3: Black, Red, Silk, Cotton
**Selected:**
- Colors: Black, Red
- Materials: Silk, Cotton

**Result:** Products that have:
- (Black AND Silk) OR (Black AND Cotton) OR (Red AND Cotton) OR (Red AND Silk)
- = Products with (Black OR Red) color AND (Silk OR Cotton) material

**SQL Logic:**
```sql
WHERE (product has Black color OR product has Red color)
  AND (product has Silk material OR product has Cotton material)
```

## Implementation Pattern

### Step 1: City Filter (Mandatory if selected)
- If cities selected: Products MUST be in selected cities (OR if multiple)
- If no city selected: No city restriction

### Step 2: Other Facet Filters (AND across types, OR within type)
- For each facet type (colors, materials, product_types, occasions):
  - Get products matching ANY selected value in that type (OR)
- Intersect results across all facet types (AND)

### Pseudocode:
```javascript
let filteredProductIds = allProductIds;

// Step 1: City filter (mandatory if selected)
if (selectedCityIds.length > 0) {
  filteredProductIds = filteredProductIds INTERSECT 
    products available in ANY selected city;
}

// Step 2: Other facet filters
if (selectedColorIds.length > 0) {
  filteredProductIds = filteredProductIds INTERSECT 
    products with ANY selected color;
}

if (selectedMaterialIds.length > 0) {
  filteredProductIds = filteredProductIds INTERSECT 
    products with ANY selected material;
}

// ... repeat for product_types, occasions

return filteredProductIds;
```

### SQL Pattern:
```sql
SELECT DISTINCT p.id
FROM products p
WHERE p.is_active = true
-- City filter (mandatory if selected)
AND (
  -- If no cities selected, show all
  :no_cities_selected
  OR
  -- If cities selected, must be in at least one
  p.id IN (
    SELECT product_id FROM product_cities 
    WHERE city_id IN (selected_city_ids)
  )
)
-- Other facet filters (AND across types)
AND (
  :no_colors_selected
  OR p.id IN (
    SELECT product_id FROM product_colors 
    WHERE color_id IN (selected_color_ids)
  )
)
AND (
  :no_materials_selected
  OR p.id IN (
    SELECT product_id FROM product_materials 
    WHERE material_id IN (selected_material_ids)
  )
)
-- ... repeat for product_types, occasions
```

## Visual Example

**Product A:**
- Colors: Red, Blue
- Materials: Silk
- Cities: Rajkot, Surat

**Product B:**
- Colors: Black, Red
- Materials: Cotton, Silk
- Cities: Ahmedabad

**Filter: Red, Black, Silk, Rajkot**

**Result:**
- Product A: ✅ Matches (Red AND Silk AND Rajkot)
- Product B: ❌ Doesn't match (missing Rajkot)

**Filter: Red, Black, Silk**

**Result:**
- Product A: ✅ Matches (Red AND Silk)
- Product B: ✅ Matches (Black AND Silk) OR (Red AND Silk)

