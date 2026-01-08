/**
 * Product Filtering Utility Functions
 * 
 * Filtering Logic:
 * - City: Mandatory if selected (products MUST be in selected cities)
 * - Multiple Cities: OR (products in ANY selected city)
 * - Other Facets: OR within type, AND across types
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface FilterOptions {
  cityIds?: string[];
  colorIds?: string[];
  materialIds?: string[];
  productTypeIds?: string[];
  occasionIds?: string[];
}

/**
 * Filter products based on selected facets
 * 
 * @param supabase - Supabase client instance
 * @param filters - Selected filter options
 * @returns Array of product IDs that match the filters
 */
export async function filterProductsByFacets(
  supabase: SupabaseClient,
  filters: FilterOptions
): Promise<string[]> {
  const {
    cityIds = [],
    colorIds = [],
    materialIds = [],
    productTypeIds = [],
    occasionIds = []
  } = filters;

  // Start with all active products
  let query = supabase
    .from('products')
    .select('id')
    .eq('is_active', true);

  // Build filter conditions
  const conditions: string[] = [];

  // City filter (mandatory if selected)
  if (cityIds.length > 0) {
    // Get products available in selected cities
    const { data: cityProducts } = await supabase
      .from('product_cities')
      .select('product_id')
      .in('city_id', cityIds);

    if (cityProducts && cityProducts.length > 0) {
      const productIdsInCities = cityProducts.map((cp: any) => cp.product_id);
      conditions.push(`id.in.(${productIdsInCities.join(',')})`);
    } else {
      // No products in selected cities
      return [];
    }
  }

  // Color filter (OR within colors)
  if (colorIds.length > 0) {
    const { data: colorProducts } = await supabase
      .from('product_colors')
      .select('product_id')
      .in('color_id', colorIds);

    if (colorProducts && colorProducts.length > 0) {
      const productIdsWithColors = colorProducts.map((cp: any) => cp.product_id);
      if (conditions.length > 0) {
        // Intersect with existing conditions
        const existingIds = conditions[0].match(/\(([^)]+)\)/)?.[1]?.split(',') || [];
        const intersection = existingIds.filter(id => productIdsWithColors.includes(id));
        if (intersection.length === 0) return [];
        conditions[0] = `id.in.(${intersection.join(',')})`;
      } else {
        conditions.push(`id.in.(${productIdsWithColors.join(',')})`);
      }
    } else {
      return [];
    }
  }

  // Material filter (OR within materials)
  if (materialIds.length > 0) {
    const { data: materialProducts } = await supabase
      .from('product_materials')
      .select('product_id')
      .in('material_id', materialIds);

    if (materialProducts && materialProducts.length > 0) {
      const productIdsWithMaterials = materialProducts.map((cp: any) => cp.product_id);
      if (conditions.length > 0) {
        const existingIds = conditions[0].match(/\(([^)]+)\)/)?.[1]?.split(',') || [];
        const intersection = existingIds.filter(id => productIdsWithMaterials.includes(id));
        if (intersection.length === 0) return [];
        conditions[0] = `id.in.(${intersection.join(',')})`;
      } else {
        conditions.push(`id.in.(${productIdsWithMaterials.join(',')})`);
      }
    } else {
      return [];
    }
  }

  // Product Type filter (OR within types)
  if (productTypeIds.length > 0) {
    const { data: typeProducts } = await supabase
      .from('product_product_types')
      .select('product_id')
      .in('product_type_id', productTypeIds);

    if (typeProducts && typeProducts.length > 0) {
      const productIdsWithTypes = typeProducts.map((cp: any) => cp.product_id);
      if (conditions.length > 0) {
        const existingIds = conditions[0].match(/\(([^)]+)\)/)?.[1]?.split(',') || [];
        const intersection = existingIds.filter(id => productIdsWithTypes.includes(id));
        if (intersection.length === 0) return [];
        conditions[0] = `id.in.(${intersection.join(',')})`;
      } else {
        conditions.push(`id.in.(${productIdsWithTypes.join(',')})`);
      }
    } else {
      return [];
    }
  }

  // Occasion filter (OR within occasions)
  if (occasionIds.length > 0) {
    const { data: occasionProducts } = await supabase
      .from('product_occasions')
      .select('product_id')
      .in('occasion_id', occasionIds);

    if (occasionProducts && occasionProducts.length > 0) {
      const productIdsWithOccasions = occasionProducts.map((cp: any) => cp.product_id);
      if (conditions.length > 0) {
        const existingIds = conditions[0].match(/\(([^)]+)\)/)?.[1]?.split(',') || [];
        const intersection = existingIds.filter(id => productIdsWithOccasions.includes(id));
        if (intersection.length === 0) return [];
        conditions[0] = `id.in.(${intersection.join(',')})`;
      } else {
        conditions.push(`id.in.(${productIdsWithOccasions.join(',')})`);
      }
    } else {
      return [];
    }
  }

  // If no filters selected, return all active products
  if (conditions.length === 0) {
    const { data: allProducts } = await supabase
      .from('products')
      .select('id')
      .eq('is_active', true);
    
    return allProducts?.map((p: any) => p.id) || [];
  }

  // Apply final filter
  const { data: filteredProducts } = await supabase
    .from('products')
    .select('id')
    .eq('is_active', true)
    .in('id', conditions[0].match(/\(([^)]+)\)/)?.[1]?.split(',') || []);

  return filteredProducts?.map((p: any) => p.id) || [];
}

/**
 * Optimized version using single query with joins
 * More efficient for complex filters
 */
export async function filterProductsByFacetsOptimized(
  supabase: SupabaseClient,
  filters: FilterOptions
): Promise<string[]> {
  const {
    cityIds = [],
    colorIds = [],
    materialIds = [],
    productTypeIds = [],
    occasionIds = []
  } = filters;

  // Build query with joins
  let query = supabase
    .from('products')
    .select(`
      id,
      product_cities!inner(city_id),
      product_colors(color_id),
      product_materials(material_id),
      product_product_types(product_type_id),
      product_occasions(occasion_id)
    `)
    .eq('is_active', true);

  // City filter (mandatory if selected)
  if (cityIds.length > 0) {
    query = query.in('product_cities.city_id', cityIds);
  }

  // Apply other filters
  // Note: This is a simplified version - actual implementation may need
  // to use separate queries and intersect results for optimal performance

  const { data, error } = await query;

  if (error) {
    console.error('Filter error:', error);
    return [];
  }

  if (!data) return [];

  // Filter in memory for other facets
  let filtered = data;

  if (colorIds.length > 0) {
    filtered = filtered.filter((p: any) => 
      p.product_colors?.some((pc: any) => colorIds.includes(pc.color_id))
    );
  }

  if (materialIds.length > 0) {
    filtered = filtered.filter((p: any) => 
      p.product_materials?.some((pm: any) => materialIds.includes(pm.material_id))
    );
  }

  if (productTypeIds.length > 0) {
    filtered = filtered.filter((p: any) => 
      p.product_product_types?.some((pt: any) => productTypeIds.includes(pt.product_type_id))
    );
  }

  if (occasionIds.length > 0) {
    filtered = filtered.filter((p: any) => 
      p.product_occasions?.some((po: any) => occasionIds.includes(po.occasion_id))
    );
  }

  return filtered.map((p: any) => p.id);
}



