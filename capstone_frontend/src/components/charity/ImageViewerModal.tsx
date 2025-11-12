import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Upload, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  imageType: "profile" | "cover";
  charityName: string;
  onImageUpdate: (file: File, type: "profile" | "cover") => Promise<void>;
}

export function ImageViewerModal({
  open,
  onOpenChange,
  imageUrl,
  imageType,
  charityName,
  onImageUpdate,
}: ImageViewerModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      await onImageUpdate(selectedFile, imageType);
      toast.success(
        `${imageType === "profile" ? "Profile photo" : "Cover photo"} updated successfully!`
      );
      setPreviewUrl(null);
      setSelectedFile(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(`Failed to update ${imageType === "profile" ? "profile photo" : "cover photo"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
          <DialogTitle className="text-base sm:text-lg">
            {previewUrl
              ? `Change ${imageType === "profile" ? "Profile Photo" : "Cover Photo"}`
              : `${charityName} - ${imageType === "profile" ? "Profile Photo" : "Cover Photo"}`}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {previewUrl
              ? "Preview your new image and confirm to save changes"
              : `View and update your ${imageType === "profile" ? "profile photo" : "cover photo"}`}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          {/* Image Display Area */}
          <div className="flex items-center justify-center p-3 sm:p-6">
            {previewUrl || imageUrl ? (
              <div className="relative max-w-full">
                <img
                  src={previewUrl || imageUrl || ""}
                  alt={`${charityName} ${imageType}`}
                  className={`max-h-[50vh] sm:max-h-[60vh] w-full sm:w-auto rounded-lg shadow-2xl ${
                    imageType === "profile" ? "max-w-[280px] sm:max-w-md" : "max-w-full"
                  }`}
                  style={{
                    objectFit: imageType === "profile" ? "cover" : "contain",
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 sm:px-8 text-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-orange-100 to-pink-100 dark:from-orange-900/20 dark:to-pink-900/20 flex items-center justify-center mb-3 sm:mb-4">
                  <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-orange-400" />
                </div>
                <p className="text-base sm:text-lg font-medium text-muted-foreground mb-2">
                  No {imageType === "profile" ? "profile photo" : "cover photo"} yet
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70">
                  Upload a photo to personalize your charity profile
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
            {previewUrl ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isUploading} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading} className="bg-[#F2A024] hover:bg-[#E89015] w-full sm:w-auto">
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Save Changes</span>
                      <span className="sm:hidden">Save</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-[#F2A024] hover:bg-[#E89015] w-full sm:w-auto"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Change {imageType === "profile" ? "Profile Photo" : "Cover Photo"}</span>
                  <span className="sm:hidden">Change Photo</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
