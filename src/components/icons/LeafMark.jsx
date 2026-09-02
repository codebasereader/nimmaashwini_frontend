import { Leaf } from "lucide-react";
import { iconProps } from "../../lib/icons";

/** Brand leaf accent — olive stroke weight matches site chrome. */
export default function LeafMark({
  className = "h-4 w-4 text-olive-600",
  size = 16,
}) {
  return <Leaf {...iconProps(size)} className={className} />;
}
