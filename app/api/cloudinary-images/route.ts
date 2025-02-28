import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Define proper types for Cloudinary resources
interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  format: string;
  version: number;
  resource_type: string;
  type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  folder: string;
  url: string;
  secure_url: string;
}

interface CloudinarySearchResponse {
  resources: CloudinaryResource[];
  total_count: number;
}

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function GET() {
  try {
    const result = (await cloudinary.search
      .expression("folder:next-cloudinary") // Replace 'next-cloudinary' with your folder if needed
      .sort_by("public_id", "desc")
      .max_results(30)
      .execute()) as CloudinarySearchResponse;

    const imageUrls = result.resources.map((resource: CloudinaryResource) => ({
      secure_url: resource.secure_url,
    }));

    return NextResponse.json({ resources: imageUrls });
  } catch (error) {
    console.error("Error fetching images from Cloudinary:", error);
    return NextResponse.json(
      { message: "Error fetching images from Cloudinary" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { publicId } = body;

    if (!publicId) {
      return new NextResponse("Public ID is required", { status: 400 });
    }

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CLOUDINARY_DELETE]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
