import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const BASE_URL = "https://ssapi.shipstation.com";

async function getCredentials(sellerId?: string): Promise<{ apiKey: string; secretKey: string }> {
  let sellerApiKey: string | null = null;
  let sellerSecretKey: string | null = null;

  if (sellerId) {
    try {
      const credDoc = await admin.firestore().collection("seller_credentials").doc(sellerId).get();
      if (credDoc.exists) {
        const data = credDoc.data();
        if (data?.enabled !== false) {
          sellerApiKey = data?.apiKey || data?.shipstationApiKey || null;
          sellerSecretKey = data?.secretKey || data?.shipstationSecretKey || null;
        }
      }
    } catch (err) {
      console.warn(`[ShipStation] Warning fetching credentials for seller ${sellerId}:`, err);
    }
  }

  if (sellerApiKey && sellerSecretKey) {
    return { apiKey: sellerApiKey, secretKey: sellerSecretKey };
  }

  let configKey: string | null = null;
  let configSecret: string | null = null;
  try {
    configKey = functions.config()?.shipstation?.api_key || null;
    configSecret = functions.config()?.shipstation?.secret_key || null;
  } catch (e) {
    // ignore
  }

  const apiKey = process.env.SHIPSTATION_API_KEY || configKey || "";
  const secretKey = process.env.SHIPSTATION_SECRET_KEY || configSecret || "";

  return { apiKey, secretKey };
}

async function getAuthHeader(sellerId?: string): Promise<string> {
  const { apiKey, secretKey } = await getCredentials(sellerId);
  const authString = Buffer.from(`${apiKey}:${secretKey}`).toString("base64");
  return `Basic ${authString}`;
}

export interface ShipStationRateOptions {
  sellerId?: string;
  carrierCode: string;
  fromPostalCode: string;
  toPostalCode: string;
  toCountry?: string;
  weight: {
    value: number;
    units: "pounds" | "ounces" | "grams";
  };
  dimensions?: {
    units: "inches" | "centimeters";
    length: number;
    width: number;
    height: number;
  };
}

export interface ShipStationOrderAddress {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
  phone?: string;
}

export interface ShipStationOrderItem {
  lineItemKey?: string;
  sku?: string;
  name: string;
  imageUrl?: string;
  weight?: {
    value: number;
    units: "pounds" | "ounces" | "grams";
  };
  quantity: number;
  unitPrice: number;
}

export interface ShipStationCreateOrderParams {
  sellerId?: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: "awaiting_payment" | "awaiting_shipment" | "shipped" | "on_hold" | "cancelled";
  billTo: ShipStationOrderAddress;
  shipTo: ShipStationOrderAddress;
  items: ShipStationOrderItem[];
  amountPaid?: number;
  shippingAmount?: number;
  carrierCode?: string;
  serviceCode?: string;
  packageCode?: string;
  confirmation?: "none" | "delivery" | "signature" | "adult_signature" | "direct";
  weight?: {
    value: number;
    units: "pounds" | "ounces" | "grams";
  };
}

/**
 * Fetch supported carriers from ShipStation API
 */
export async function getShipStationCarriers(sellerId?: string) {
  const authHeader = await getAuthHeader(sellerId);
  const response = await fetch(`${BASE_URL}/carriers`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipStation getCarriers Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Get shipping rates quote for a package
 */
export async function getShipStationRates(options: ShipStationRateOptions) {
  const authHeader = await getAuthHeader(options.sellerId);
  const payload = {
    carrierCode: options.carrierCode,
    fromPostalCode: options.fromPostalCode,
    toPostalCode: options.toPostalCode,
    toCountry: options.toCountry || "US",
    weight: options.weight,
    dimensions: options.dimensions || null
  };

  const response = await fetch(`${BASE_URL}/shipments/getrates`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipStation getRates Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

/**
 * Create or Update an order in ShipStation
 */
export async function createShipStationOrder(orderParams: ShipStationCreateOrderParams) {
  const authHeader = await getAuthHeader(orderParams.sellerId);
  const response = await fetch(`${BASE_URL}/orders/createorder`, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderParams)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipStation createOrder Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}
