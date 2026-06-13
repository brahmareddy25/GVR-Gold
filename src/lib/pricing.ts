// ============================================================
// GVR Gold & Silver — Pricing Calculations
// ============================================================

import type { Product, GoldRate } from './types';

export interface PriceBreakdown {
  metalValue: number;
  makingCharges: number;
  subtotal: number;
  gst: number;
  estimatedTotal: number;
}

/**
 * Calculate the estimated price for a product based on current market rates.
 * 
 * Formula: Metal Value + Making Charges + GST = Estimated Price
 * 
 * Metal Value = Weight × Rate per gram
 * Making Charges = Flat amount OR percentage of metal value
 * GST = gstPercentage% of (Metal Value + Making Charges)
 */
export function calculatePrice(
  product: Product,
  rates: GoldRate,
  gstPercentage: number
): PriceBreakdown {
  // Determine the rate per gram based on metal type and purity
  let ratePerGram = 0;
  
  if (product.metalType === 'gold') {
    switch (product.purity) {
      case '24K':
        ratePerGram = rates.gold24k;
        break;
      case '22K':
        ratePerGram = rates.gold22k;
        break;
      case '18K':
        ratePerGram = rates.gold24k * 0.75; // 18/24 of 24K rate
        break;
      default:
        ratePerGram = rates.gold22k; // Default to 22K for gold
    }
  } else {
    ratePerGram = rates.silver;
  }

  // Calculate metal value
  const metalValue = product.weight * ratePerGram;

  // Calculate making charges
  let makingCharges = 0;
  if (product.makingChargeType === 'percentage') {
    makingCharges = (metalValue * product.makingCharges) / 100;
  } else {
    makingCharges = product.makingCharges;
  }

  // Subtotal before GST
  const subtotal = metalValue + makingCharges;

  // GST calculation
  const gst = (subtotal * gstPercentage) / 100;

  // Estimated total
  const estimatedTotal = subtotal + gst;

  return {
    metalValue: Math.round(metalValue),
    makingCharges: Math.round(makingCharges),
    subtotal: Math.round(subtotal),
    gst: Math.round(gst),
    estimatedTotal: Math.round(estimatedTotal),
  };
}

/**
 * Format currency in Indian Rupee format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format rate per gram
 */
export function formatRate(rate: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(rate);
}
