import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadDevEnv } from "@/lib/env.ts";

loadDevEnv();

type SpacesConfig = {
  bucket: string;
  region: string;
  endpoint: string;
  key: string;
  secret: string;
};

let spacesClient: S3Client | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required Spaces env var: ${name}`);
  }

  return value;
}

export function getSpacesConfig(): SpacesConfig {
  return {
    bucket: getRequiredEnv("DO_SPACES_BUCKET"),
    region: getRequiredEnv("DO_SPACES_REGION"),
    endpoint: getRequiredEnv("DO_SPACES_ENDPOINT"),
    key: getRequiredEnv("DO_SPACES_KEY"),
    secret: getRequiredEnv("DO_SPACES_SECRET"),
  };
}

export function getSpacesClient(): S3Client {
  if (spacesClient) {
    return spacesClient;
  }

  const config = getSpacesConfig();

  spacesClient = new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.key,
      secretAccessKey: config.secret,
    },
  });

  return spacesClient;
}

export async function uploadBufferToSpaces(params: {
  key: string;
  contentType: string;
  body: Buffer;
}): Promise<void> {
  const config = getSpacesConfig();
  const client = getSpacesClient();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      ACL: "public-read",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
}
