import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { setUnauthorizedHandler } from "./api/client.js";
import store from "./store/index.js";
import { logout } from "./store/slices/authSlice.js";

setUnauthorizedHandler(() => {
  store.dispatch(logout());
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <CartProvider>
            <App />
          </CartProvider>
        </BrowserRouter>
      </MotionConfig>
    </Provider>
  </StrictMode>,
);
