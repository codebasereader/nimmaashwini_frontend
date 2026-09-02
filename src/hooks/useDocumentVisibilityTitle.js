import { useEffect } from "react";

const DEFAULT_TITLE = "Nimma Ashwini";
const HIDDEN_TITLE = "ನಿಮ್ಮ ಅಶ್ವಿನಿ";

export default function useDocumentVisibilityTitle() {
  useEffect(() => {
    const updateTitle = () => {
      document.title = document.hidden ? HIDDEN_TITLE : DEFAULT_TITLE;
    };

    document.addEventListener("visibilitychange", updateTitle);

    return () => {
      document.removeEventListener("visibilitychange", updateTitle);
      document.title = DEFAULT_TITLE;
    };
  }, []);
}
