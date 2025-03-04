"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash, X, Upload } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  onRemove: (value: string) => void;
  value: string[];
}

interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

interface CloudinaryResult {
  info?: CloudinaryUploadWidgetInfo | string;
}

interface CloudinaryImageResource {
  secure_url: string;
}

interface CloudinaryResponse {
  resources: CloudinaryImageResource[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  onChange,
  onRemove,
  value,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchCloudinaryImages();
  }, []);

  const fetchCloudinaryImages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/cloudinary-images`);
      const data = (await response.json()) as CloudinaryResponse;
      setExistingImages(data.resources.map((img) => img.secure_url));
    } catch (error) {
      console.error("Error fetching Cloudinary images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCloudinaryImage = async (url: string) => {
    try {
      setIsDeleting(url);

      // Extract the public_id from the URL
      const urlParts = url.split("/");
      const filename = urlParts[urlParts.length - 1];
      const publicId = filename.split(".")[0];

      // Call API to delete the image
      const response = await fetch("/api/cloudinary-images", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ publicId }),
      });

      if (response.ok) {
        // Remove from existingImages state
        setExistingImages((prev) => prev.filter((img) => img !== url));

        // If this image was also in the selected values, remove it there too
        if (value.includes(url)) {
          onRemove(url);
        }
      } else {
        console.error("Failed to delete image from Cloudinary");
      }
    } catch (error) {
      console.error("Error deleting image:", error);
    } finally {
      setIsDeleting(null);
    }
  };

  const onSuccess = (result: CloudinaryResult) => {
    if (
      result.info &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      const imageUrl = result.info.secure_url;
      onChange(imageUrl);

      // Add the new image to the existingImages list
      setExistingImages((prev) => [...prev, imageUrl]);
    } else if (result.info && typeof result.info === "string") {
      const imageUrl = result.info;
      onChange(imageUrl);

      // Add the new image to the existingImages list
      setExistingImages((prev) => [...prev, imageUrl]);
    } else {
      console.error("Unexpected Cloudinary result info:", result.info);
    }
  };

  const openImageBrowser = () => {
    setShowImageSelector(true);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        {value.map((url) => (
          <div
            key={url}
            className="relative w-[200px] h-[200px] rounded-md overflow-hidden border border-zinc-200"
          >
            <div className="z-10 absolute top-2 right-2">
              <Button
                type="button"
                onClick={() => onRemove(url)}
                variant="destructive"
                size="icon"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            <Image fill className="object-cover" alt="image" src={url} />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          type="button"
          onClick={openImageBrowser}
          variant="outline"
          className="border-zinc-300 hover:bg-zinc-100"
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Upload an image
        </Button>
      </div>

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-black text-white rounded-xl shadow-xl border border-zinc-700 overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium tracking-tight">
                  Select an Image
                </h3>
                <Button
                  onClick={() => setShowImageSelector(false)}
                  variant="outline"
                  size="icon"
                  className="rounded-full border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Upload Button in Modal */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex-1">
                  <CldUploadWidget
                    onSuccess={onSuccess}
                    uploadPreset="nwkydo0u"
                    options={{
                      folder: "next-cloudinary",
                    }}
                  >
                    {({ open }) => (
                      <Button
                        type="button"
                        onClick={() => open()}
                        disabled={disabled}
                        variant="secondary"
                        className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload new image
                      </Button>
                    )}
                  </CldUploadWidget>
                </div>
                <div className="flex items-center">
                  <Button
                    onClick={fetchCloudinaryImages}
                    variant="outline"
                    size="sm"
                    className="ml-2 border-zinc-700 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    disabled={isLoading}
                  >
                    <div
                      className={`h-4 w-4 mr-1 ${
                        isLoading ? "animate-spin" : ""
                      }`}
                    >
                      {isLoading ? (
                        <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 2v6h-6"></path>
                          <path d="M3 12a9 9 0 0 1 15-6.7l3 2.7"></path>
                          <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
                          <path d="M21 22v-6h-6"></path>
                        </svg>
                      )}
                    </div>
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {existingImages.length > 0 ? (
                  existingImages.map((url) => (
                    <div
                      key={url}
                      className="relative group aspect-square overflow-hidden rounded-md bg-zinc-800"
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={url}
                          alt="Cloudinary Image"
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover cursor-pointer transition-all duration-300"
                          onClick={() => {
                            onChange(url);
                            setShowImageSelector(false);
                          }}
                        />
                      </div>
                      <div
                        className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300"
                        onClick={() => {
                          onChange(url);
                          setShowImageSelector(false);
                        }}
                      >
                        <span className="text-xs font-medium text-white px-3 py-1.5 rounded-full bg-black bg-opacity-50 pointer-events-none">
                          Select
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCloudinaryImage(url);
                          }}
                          disabled={isDeleting === url}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          aria-label="Delete image"
                        >
                          {isDeleting === url ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Trash className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex items-center justify-center py-12 text-zinc-400">
                    {isLoading
                      ? "Loading images..."
                      : "No images available in your Cloudinary account"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
