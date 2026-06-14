// ============================================================
// GVR Gold & Silver — S3 Data Layer
// ============================================================

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Product, RatesConfig, StoreSettings, AdminCredentials } from './types';

// S3 Client singleton
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.S3_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  return s3Client;
}

const BUCKET = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || 'gvr-gold';

// ─── Generic S3 Helpers ────────────────────────────────────

async function getJsonFromS3<T>(key: string, fallback: T): Promise<T> {
  try {
    const client = getS3Client();
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const response = await client.send(command);
    const body = await response.Body?.transformToString();
    if (body) {
      return JSON.parse(body) as T;
    }
    return fallback;
  } catch (error: unknown) {
    const err = error as { name?: string };
    if (err.name === 'NoSuchKey') {
      return fallback;
    }
    console.error(`Error fetching ${key} from S3:`, error);
    return fallback;
  }
}

async function putJsonToS3<T>(key: string, data: T): Promise<void> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data, null, 2),
    ContentType: 'application/json',
  });
  await client.send(command);
}

// ─── Products ──────────────────────────────────────────────

export async function getProducts(): Promise<Product[]> {
  return getJsonFromS3<Product[]>('data/products.json', []);
}

export async function saveProducts(products: Product[]): Promise<void> {
  await putJsonToS3('data/products.json', products);
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find(p => p.id === id) || null;
}

export async function addProduct(product: Product): Promise<void> {
  const products = await getProducts();
  products.push(product);
  await saveProducts(products);
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
  const products = await getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  products[index] = { ...products[index], ...updates, updatedAt: new Date().toISOString() };
  await saveProducts(products);
  return products[index];
}

export async function deleteProduct(id: string): Promise<boolean> {
  const products = await getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  await saveProducts(filtered);
  return true;
}

export function generateProductId(metalType: 'gold' | 'silver', products: Product[]): string {
  const prefix = metalType === 'gold' ? 'GOLD' : 'SILVER';
  const existingIds = products
    .filter(p => p.metalType === metalType)
    .map(p => {
      const match = p.id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    });
  const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
  return `${prefix}-${String(maxId + 1).padStart(4, '0')}`;
}

// ─── Rates ─────────────────────────────────────────────────

const DEFAULT_RATES: RatesConfig = {
  currentRates: {
    gold24k: 7250,
    gold22k: 6645,
    silver: 92,
    lastUpdated: new Date().toISOString(),
    source: 'manual',
  },
  useApiRates: true,
  gstPercentage: 3,
};

export async function getRates(): Promise<RatesConfig> {
  return getJsonFromS3<RatesConfig>('data/rates.json', DEFAULT_RATES);
}

export async function saveRates(rates: RatesConfig): Promise<void> {
  await putJsonToS3('data/rates.json', rates);
}

// ─── Settings ──────────────────────────────────────────────

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'GVR Gold & Silver',
  tagline: 'Crafted for Generations. Designed to Shine.',
  logoUrl: '',
  phone: '9704223288',
  whatsapp: '919704223288',
  email: 'yaswanthgedela27@gmail.com',
  address: '',
  city: 'Hyderabad',
  state: 'Telangana',
  pincode: '500001',
  businessHours: '',
  mapEmbedUrl: '',
  socialLinks: {
    instagram: 'https://instagram.com/gvrgoldsilver',
    facebook: 'https://facebook.com/gvrgoldsilver',
    youtube: '',
    twitter: '',
  },
  aboutContent: 'For over three decades, GVR Gold & Silver has been a trusted name in fine jewelry. Our master artisans craft each piece with unparalleled precision, blending timeless tradition with contemporary elegance. Every ornament that leaves our atelier carries the hallmark of exceptional craftsmanship and enduring beauty.',
  heroHeadline: 'Crafted for Generations. Designed to Shine.',
  heroSubheadline: 'Discover exquisite gold and silver ornaments, handcrafted with precision and passion by master artisans.',
  showLiveRates: true,
};

export async function getSettings(): Promise<StoreSettings> {
  return getJsonFromS3<StoreSettings>('data/settings.json', DEFAULT_SETTINGS);
}

export async function saveSettings(settings: StoreSettings): Promise<void> {
  await putJsonToS3('data/settings.json', settings);
}

// ─── Admin ─────────────────────────────────────────────────

export async function getAdmin(): Promise<AdminCredentials> {
  const defaultAdmin: AdminCredentials = {
    name: 'Administrator',
    email: 'admin@gvrgoldsilver.com',
    username: 'admin',
    passwordHash: '$2a$10$defaulthashplaceholder', // Will be set on first login
  };
  return getJsonFromS3<AdminCredentials>('data/admin.json', defaultAdmin);
}

export async function saveAdmin(admin: AdminCredentials): Promise<void> {
  await putJsonToS3('data/admin.json', admin);
}

// ─── OTP ───────────────────────────────────────────────────

export interface OTPData {
  otp: string;
  expiresAt: number;
}

export async function getOTP(): Promise<OTPData | null> {
  try {
    return await getJsonFromS3<OTPData>('data/otp.json', null as any);
  } catch {
    return null;
  }
}

export async function saveOTP(otpData: OTPData | null): Promise<void> {
  if (otpData === null) {
    const client = getS3Client();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: 'data/otp.json' }));
    } catch (e) {
      // Ignore delete errors if it doesn't exist
    }
  } else {
    await putJsonToS3('data/otp.json', otpData);
  }
}

// ─── Image Upload ──────────────────────────────────────────

export async function uploadImage(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  await client.send(command);
  return `https://${BUCKET}.s3.${process.env.S3_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
}

export async function deleteImage(key: string): Promise<void> {
  const client = getS3Client();
  const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
  await client.send(command);
}

export async function getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}

export async function listImages(prefix: string): Promise<string[]> {
  const client = getS3Client();
  const command = new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix });
  const response = await client.send(command);
  return (response.Contents || []).map(item => item.Key || '').filter(Boolean);
}
