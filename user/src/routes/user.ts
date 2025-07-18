import express from "express";
import { getAUser, getAllUsers, loginUser, myProfile, updateName, verifyUser } from "../controllers/user.js";
import { isAuth } from "../middleware/isAuth.js";
const router = express.Router();

router.post("/login", loginUser);
router.post("/verify", verifyUser);
router.get("/profile", isAuth, myProfile);
router.put("/update/user", isAuth, updateName);
router.get("/users/all", isAuth, getAllUsers);
router.get("/users/:id", isAuth, getAUser);

export default router;
