import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../Redux/Slice/authSlice";
import {
  clearStoredAuth,
  getStoredAccessToken,
  getValidAccessToken,
} from "../../utils/auth-token";

const ProtectedRoute = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const localToken = getStoredAccessToken();
  const accessToken = getValidAccessToken(token, localToken);
  const location = useLocation();
  const hasAuthResidue = Boolean(token || localToken);

  useEffect(() => {
    if (!accessToken && hasAuthResidue) {
      clearStoredAuth();
      dispatch(logout());
    }
  }, [accessToken, dispatch, hasAuthResidue]);

  if (!accessToken) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
