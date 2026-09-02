import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { ImagePlus } from "lucide-react";
import { uploadImage } from "../../api/upload";
import { iconProps } from "../../lib/icons";

export default function ImageUpload({
  folder,
  value,
  onChange,
  label = "Image",
  multiple = false,
}) {
  const token = useSelector((state) => state.auth.token);
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      if (multiple) {
        const uploaded = [];
        for (const file of files) {
          const image = await uploadImage(file, folder, token);
          uploaded.push({ ...image, sortOrder: uploaded.length });
        }
        onChange([...(value || []), ...uploaded]);
      } else {
        const image = await uploadImage(files[0], folder, token);
        onChange(image);
      }
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    if (multiple) {
      onChange((value || []).filter((_, i) => i !== index));
    } else {
      onChange(null);
    }
  };

  const images = multiple ? value || [] : value ? [value] : [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, index) => (
          <div
            key={img.key || index}
            className="group relative h-24 w-24 overflow-hidden rounded-md border border-cream-300 bg-cream-100"
          >
            <img
              src={img.url}
              alt={img.alt || label}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute inset-0 flex items-center justify-center bg-olive-950/55 text-xs font-semibold tracking-wider text-white uppercase opacity-0 transition-opacity group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="focus-ring flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-olive-300 bg-olive-50/50 text-olive-700 transition-colors hover:border-olive-500 hover:bg-olive-100/60 disabled:opacity-60"
        >
          <ImagePlus {...iconProps(20)} />
          <span className="text-[0.65rem] font-semibold tracking-wider uppercase">
            {uploading ? "..." : "Upload"}
          </span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-brown-500">
        {label} — JPEG, PNG or WebP, max 4 MB
      </p>
      {error && <p className="text-xs text-terracotta-600">{error}</p>}
    </div>
  );
}
