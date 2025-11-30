/**
 * Servicio de búsqueda de productos por código de barras
 * Utiliza APIs gratuitas de bases de datos de códigos de barras
 */

export interface BarcodeApiResult {
  found: boolean;
  name?: string;
  brand?: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  source: string;
  rawData?: any;
}

/**
 * Consulta Open Food Facts API (gratuita, sin límites, principalmente alimentos)
 * Documentación: https://wiki.openfoodfacts.org/API
 */
async function queryOpenFoodFacts(barcode: string): Promise<BarcodeApiResult> {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'Omerix ERP - contact@omerix.com',
        },
      }
    );

    if (!response.ok) {
      return { found: false, source: 'Open Food Facts' };
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false, source: 'Open Food Facts' };
    }

    const product = data.product;

    return {
      found: true,
      name: product.product_name || product.product_name_es || product.product_name_en,
      brand: product.brands,
      description: product.generic_name || product.generic_name_es || product.ingredients_text_es || product.ingredients_text,
      category: product.categories_tags?.[0]?.replace('en:', '').replace('es:', '').replace(/-/g, ' '),
      imageUrl: product.image_url || product.image_front_url,
      source: 'Open Food Facts',
      rawData: {
        quantity: product.quantity,
        packaging: product.packaging,
        nutriscore: product.nutriscore_grade,
        countries: product.countries,
      },
    };
  } catch (error) {
    console.error('Error consultando Open Food Facts:', error);
    return { found: false, source: 'Open Food Facts (error)' };
  }
}

/**
 * Consulta Open Beauty Facts API (gratuita, cosméticos y productos de higiene)
 * Documentación: https://world.openbeautyfacts.org/
 */
async function queryOpenBeautyFacts(barcode: string): Promise<BarcodeApiResult> {
  try {
    const response = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'Omerix ERP - contact@omerix.com',
        },
      }
    );

    if (!response.ok) {
      return { found: false, source: 'Open Beauty Facts' };
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false, source: 'Open Beauty Facts' };
    }

    const product = data.product;

    return {
      found: true,
      name: product.product_name || product.product_name_es || product.product_name_en,
      brand: product.brands,
      description: product.generic_name || product.generic_name_es,
      category: product.categories_tags?.[0]?.replace('en:', '').replace('es:', '').replace(/-/g, ' '),
      imageUrl: product.image_url || product.image_front_url,
      source: 'Open Beauty Facts',
      rawData: product,
    };
  } catch (error) {
    console.error('Error consultando Open Beauty Facts:', error);
    return { found: false, source: 'Open Beauty Facts (error)' };
  }
}

/**
 * Consulta Open Pet Food Facts API (gratuita, alimentos para mascotas)
 */
async function queryOpenPetFoodFacts(barcode: string): Promise<BarcodeApiResult> {
  try {
    const response = await fetch(
      `https://world.openpetfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'Omerix ERP - contact@omerix.com',
        },
      }
    );

    if (!response.ok) {
      return { found: false, source: 'Open Pet Food Facts' };
    }

    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return { found: false, source: 'Open Pet Food Facts' };
    }

    const product = data.product;

    return {
      found: true,
      name: product.product_name || product.product_name_es || product.product_name_en,
      brand: product.brands,
      description: product.generic_name || product.generic_name_es,
      category: product.categories_tags?.[0]?.replace('en:', '').replace('es:', '').replace(/-/g, ' '),
      imageUrl: product.image_url || product.image_front_url,
      source: 'Open Pet Food Facts',
      rawData: product,
    };
  } catch (error) {
    console.error('Error consultando Open Pet Food Facts:', error);
    return { found: false, source: 'Open Pet Food Facts (error)' };
  }
}

/**
 * Consulta UPC Item DB (gratuita con límites, productos generales)
 * Documentación: https://www.upcitemdb.com/wp/docs/main/development/
 * Límite: 100 requests/día sin API key
 */
async function queryUpcItemDb(barcode: string): Promise<BarcodeApiResult> {
  try {
    const response = await fetch(
      `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Omerix ERP',
        },
      }
    );

    if (!response.ok) {
      return { found: false, source: 'UPC Item DB' };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return { found: false, source: 'UPC Item DB' };
    }

    const item = data.items[0];

    return {
      found: true,
      name: item.title,
      brand: item.brand,
      description: item.description,
      category: item.category,
      imageUrl: item.images?.[0],
      source: 'UPC Item DB',
      rawData: {
        model: item.model,
        color: item.color,
        size: item.size,
        weight: item.weight,
      },
    };
  } catch (error) {
    console.error('Error consultando UPC Item DB:', error);
    return { found: false, source: 'UPC Item DB (error)' };
  }
}

/**
 * Busca un producto por código de barras en múltiples APIs gratuitas
 * Retorna el primer resultado encontrado
 */
export async function lookupBarcodeInApis(barcode: string): Promise<BarcodeApiResult> {
  // Consultar todas las APIs en paralelo para mayor velocidad
  const [openFoodResult, openBeautyResult, openPetFoodResult, upcItemDbResult] = await Promise.all([
    queryOpenFoodFacts(barcode),
    queryOpenBeautyFacts(barcode),
    queryOpenPetFoodFacts(barcode),
    queryUpcItemDb(barcode),
  ]);

  // Priorizar resultados encontrados
  if (openFoodResult.found) return openFoodResult;
  if (openBeautyResult.found) return openBeautyResult;
  if (openPetFoodResult.found) return openPetFoodResult;
  if (upcItemDbResult.found) return upcItemDbResult;

  // Si ninguna API encontró el producto
  return {
    found: false,
    source: 'APIs consultadas: Open Food Facts, Open Beauty Facts, Open Pet Food Facts, UPC Item DB',
  };
}
