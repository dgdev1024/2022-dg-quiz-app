/**
 * @file lib/cloudinary.ts
 */

import Cloudinary from "cloudinary";

Cloudinary.v2.config({ secure: true });

export const cloudinary = Cloudinary.v2;
