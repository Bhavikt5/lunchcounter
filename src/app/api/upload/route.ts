import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { image, folder = "lunch_counter" } = await req.json();

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Get Cloudinary settings from database or process.env
    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => (settingsMap[s.key] = s.value));

    let cloudName =
      settingsMap["cloudinary_cloud_name"] ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      process.env.CLOUDINARY_CLOUD_NAME;

    let apiKey =
      settingsMap["cloudinary_api_key"] ||
      process.env.CLOUDINARY_API_KEY ||
      process.env.CLOUDINARY_KEY;

    let apiSecret =
      settingsMap["cloudinary_api_secret"] ||
      process.env.CLOUDINARY_API_SECRET;

    // Optional: Parse CLOUDINARY_URL (cloudinary://API_KEY:API_SECRET@CLOUD_NAME) if individual keys missing
    if ((!cloudName || !apiKey || !apiSecret) && process.env.CLOUDINARY_URL) {
      try {
        const rawUrl = process.env.CLOUDINARY_URL.replace(/^CLOUDINARY_URL=/, "").trim();
        const matches = rawUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
        if (matches) {
          if (!apiKey) apiKey = matches[1];
          if (!apiSecret) apiSecret = matches[2];
          if (!cloudName) cloudName = matches[3];
        }
      } catch (e) {
        console.warn("Could not parse CLOUDINARY_URL fallback");
      }
    }

    const uploadPreset =
      settingsMap["cloudinary_upload_preset"] ||
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
      process.env.CLOUDINARY_UPLOAD_PRESET;

    if (cloudName && (apiSecret || uploadPreset)) {
      const formData = new FormData();
      formData.append("file", image);
      formData.append("folder", folder);

      if (apiKey && apiSecret) {
        // Signed upload using Cloudinary API Secret
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash("sha1").update(strToSign).digest("hex");

        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);
      } else if (uploadPreset) {
        // Unsigned upload preset
        formData.append("upload_preset", uploadPreset);
      }

      const cloudinaryRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (cloudinaryRes.ok) {
        const cloudData = await cloudinaryRes.json();
        return NextResponse.json({
          success: true,
          url: cloudData.secure_url,
          publicId: cloudData.public_id,
          isCloudinary: true,
        });
      } else {
        const errorText = await cloudinaryRes.text();
        console.warn("Cloudinary upload error response:", errorText);
      }
    }

    // Fallback: Return raw image data URL if Cloudinary credentials failed or missing
    return NextResponse.json({
      success: true,
      url: image,
      isCloudinary: false,
      message: "Cloudinary settings incomplete. Using image fallback.",
    });
  } catch (error) {
    console.error("POST upload error:", error);
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
  }
}
