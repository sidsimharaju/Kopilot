import "server-only";
import { Firestore } from "@google-cloud/firestore";

declare global {
  // eslint-disable-next-line no-var
  var __firestore: Firestore | undefined;
}

export const db: Firestore =
  globalThis.__firestore ??
  new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "gcp-product-dev",
    ignoreUndefinedProperties: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__firestore = db;
}

export const projects = () => db.collection("projects");
export const featureRequests = () => db.collection("featureRequests");
export const customers = () => db.collection("customers");
