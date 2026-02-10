import { useEffect } from "react";
import { useAuthStore } from "./authStore.js";
import toast from "react-hot-toast";

function AutoLogoutToastWatcher() {
  const warningActive = useAuthStore((state) => state.warningActive);
  const setWarningActive = useAuthStore((state) => state.setWarningActive);

  useEffect(() => {
                    toast("You will be logged out in 30 seconds due to inactivity", {
                style: { background: "#FBBF24", color: "#000" }, // yellow background
                duration: 3000
                });
  }, [warningActive, setWarningActive]);

  return null;
}

export default AutoLogoutToastWatcher;