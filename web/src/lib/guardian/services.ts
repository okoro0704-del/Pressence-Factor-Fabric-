/**
 * @file Guardian Service Definitions
 * @description Supported financial services for Sentinel protection
 */

export type ServiceCategory = "banking" | "fintech" | "crypto" | "payment";

export type CredentialFieldType = "text" | "password" | "api_key";

export interface CredentialField {
  id: string;
  label: string;
  type: CredentialFieldType;
  placeholder: string;
  required: boolean;
  helpText?: string;
}

export interface GuardianService {
  id: string;
  name: string;
  category: ServiceCategory;
  logo: string;
  description: string;
  credentialFields: CredentialField[];
  color: string;
  isPopular?: boolean;
}

export const GUARDIAN_SERVICES: GuardianService[] = [
  {
    id: "uba",
    name: "UBA Bank",
    category: "banking",
    logo: "🏦",
    description: "United Bank for Africa - Protect your business and personal accounts",
    color: "#C8102E",
    isPopular: true,
    credentialFields: [
      {
        id: "accountNumber",
        label: "Account Number",
        type: "text",
        placeholder: "1234567890",
        required: true,
        helpText: "Your UBA account number",
      },
      {
        id: "apiKey",
        label: "API Key",
        type: "api_key",
        placeholder: "uba_live_...",
        required: true,
        helpText: "Get this from UBA Developer Portal",
      },
      {
        id: "apiSecret",
        label: "API Secret",
        type: "password",
        placeholder: "••••••••",
        required: true,
        helpText: "Keep this secret - never share",
      },
    ],
  },
  {
    id: "opay",
    name: "OPay",
    category: "fintech",
    logo: "💳",
    description: "OPay Digital Wallet - Monitor transactions and prevent fraud",
    color: "#00C48C",
    isPopular: true,
    credentialFields: [
      {
        id: "phoneNumber",
        label: "Phone Number",
        type: "text",
        placeholder: "+234...",
        required: true,
        helpText: "Your OPay registered phone number",
      },
      {
        id: "merchantId",
        label: "Merchant ID",
        type: "text",
        placeholder: "OPAY...",
        required: false,
        helpText: "Only for business accounts",
      },
      {
        id: "apiToken",
        label: "API Token",
        type: "api_key",
        placeholder: "opay_...",
        required: true,
        helpText: "Generate from OPay Business Dashboard",
      },
    ],
  },
  {
    id: "binance",
    name: "Binance",
    category: "crypto",
    logo: "₿",
    description: "Binance Exchange - Protect your crypto assets from unauthorized access",
    color: "#F3BA2F",
    isPopular: true,
    credentialFields: [
      {
        id: "apiKey",
        label: "API Key",
        type: "api_key",
        placeholder: "Your Binance API Key",
        required: true,
        helpText: "Create in Binance Account > API Management",
      },
      {
        id: "apiSecret",
        label: "API Secret",
        type: "password",
        placeholder: "••••••••",
        required: true,
        helpText: "CRITICAL: Enable read-only permissions only",
      },
    ],
  },
  {
    id: "gtbank",
    name: "GTBank",
    category: "banking",
    logo: "🏛️",
    description: "Guaranty Trust Bank - Secure your GTBank accounts",
    color: "#FF6600",
    credentialFields: [
      {
        id: "accountNumber",
        label: "Account Number",
        type: "text",
        placeholder: "0123456789",
        required: true,
      },
      {
        id: "apiKey",
        label: "API Key",
        type: "api_key",
        placeholder: "gtb_...",
        required: true,
      },
    ],
  },
  {
    id: "paystack",
    name: "Paystack",
    category: "payment",
    logo: "💰",
    description: "Paystack Payments - Monitor payment gateway transactions",
    color: "#00C3F7",
    credentialFields: [
      {
        id: "publicKey",
        label: "Public Key",
        type: "text",
        placeholder: "pk_live_...",
        required: true,
      },
      {
        id: "secretKey",
        label: "Secret Key",
        type: "password",
        placeholder: "sk_live_...",
        required: true,
        helpText: "Never share your secret key",
      },
    ],
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    category: "payment",
    logo: "🦋",
    description: "Flutterwave - Protect your payment processing",
    color: "#F5A623",
    credentialFields: [
      {
        id: "publicKey",
        label: "Public Key",
        type: "text",
        placeholder: "FLWPUBK-...",
        required: true,
      },
      {
        id: "secretKey",
        label: "Secret Key",
        type: "password",
        placeholder: "FLWSECK-...",
        required: true,
      },
    ],
  },
];

export function getServiceById(id: string): GuardianService | undefined {
  return GUARDIAN_SERVICES.find((service) => service.id === id);
}

export function getServicesByCategory(category: ServiceCategory): GuardianService[] {
  return GUARDIAN_SERVICES.filter((service) => service.category === category);
}

export function getPopularServices(): GuardianService[] {
  return GUARDIAN_SERVICES.filter((service) => service.isPopular);
}

